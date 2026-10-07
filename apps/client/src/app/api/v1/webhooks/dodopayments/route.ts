import { Prisma, type Payment } from "@prisma/client";
import { NextResponse } from "next/server";
import { client } from "@/lib/db";
import { dodopayments } from "@/lib/dodopayments";

export const runtime = "nodejs";

type Tx = Prisma.TransactionClient;
type Event = ReturnType<typeof dodopayments.webhooks.unwrap>;
type Success = Extract<Event, { type: "payment.succeeded" }>["data"];
type Metadata = Record<string, string | number | boolean>;
type PayType = "vote" | "sponsor_new" | "sponsor_renew";

function metadataOf(data: unknown): Metadata {
  if (!data || typeof data !== "object" || !("metadata" in data)) return {};
  const value = data.metadata;
  return value && typeof value === "object" ? (value as Metadata) : {};
}

function required(metadata: Metadata, key: string) {
  const value = metadata[key];
  if (typeof value !== "string" || !value) {
    throw new Error(`Missing payment metadata: ${key}.`);
  }
  return value;
}

function payTypeOf(metadata: Metadata): PayType {
  const value = metadata.paytype;
  if (value === "vote" || value === "sponsor_new" || value === "sponsor_renew") {
    return value;
  }
  throw new Error("Invalid payment metadata: paytype.");
}

async function lock(tx: Tx, key: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))`;
}

function termFrom(startDate: Date) {
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 30);
  return endDate;
}

async function logPayment(tx: Tx, payment: Payment) {
  await tx.userPaymentLog.create({
    data: {
      userId: payment.userId,
      paymentId: payment.id,
      purchasedAmount: payment.amount,
      currency: payment.currency,
    },
  });
}

async function processVote(tx: Tx, data: Success, metadata: Metadata) {
  const userId = required(metadata, "user_id");
  const paymentId = required(metadata, "local_payment_id");
  const countryId = required(metadata, "country_id");
  const voteType = required(metadata, "vote_type");
  if (voteType !== "UPVOTE" && voteType !== "DOWNVOTE") {
    throw new Error("Invalid vote type.");
  }

  await lock(tx, `payment:${paymentId}`);
  const payment = await tx.payment.findFirst({
    where: { id: paymentId, userId },
  });
  if (!payment) throw new Error("Vote payment was not found.");
  if (payment.status === "COMPLETED") return;
  if (!payment.voteQuantity || payment.voteQuantity < 1) {
    throw new Error("Vote payment has no vote quantity.");
  }

  const country = await tx.country.findUnique({
    where: { id: countryId },
    select: { id: true },
  });
  if (!country) throw new Error("Vote country was not found.");

  await tx.country.update({
    where: { id: country.id },
    data:
      voteType === "UPVOTE"
        ? { totalUpvoteCount: { increment: payment.voteQuantity } }
        : { totalDownvoteCount: { increment: payment.voteQuantity } },
  });
  await tx.voteLog.create({
    data: {
      userId,
      countryId,
      voteType,
      voteIntentionType: "PURCHASED",
      count: payment.voteQuantity,
      requestId: `payment:${payment.id}`,
      result: { paymentId: payment.id, fulfilledBy: "DODO_PAYMENTS_WEBHOOK" },
      paidDetail: {
        create: {
          userId,
          countryId,
          voteType,
          count: payment.voteQuantity,
        },
      },
    },
  });
  await logPayment(tx, payment);
  await tx.payment.update({
    where: { id: payment.id },
    data: { status: "COMPLETED", dodoPaymentId: data.payment_id },
  });
}

async function sponsorPayment(tx: Tx, data: Success, userId: string) {
  const existing = await tx.payment.findUnique({
    where: { dodoPaymentId: data.payment_id },
  });
  if (existing) return existing;

  const payment = await tx.payment.create({
    data: {
      userId,
      dodoPaymentId: data.payment_id,
      amount: data.total_amount / 100,
      currency: data.currency,
      status: "COMPLETED",
      transaction: { create: {} },
    },
  });
  await logPayment(tx, payment);
  return payment;
}

async function processNewSponsor(tx: Tx, data: Success) {
  const userId = required(metadataOf(data), "user_id");
  await lock(tx, `sponsor-customer:${userId}`);

  const user = await tx.user.findFirst({
    where: {
      id: userId,
      email: data.customer.email.trim().toLowerCase(),
    },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "USER") {
    throw new Error("User is not eligible for a new sponsorship.");
  }

  const payment = await sponsorPayment(tx, data, user.id);
  const fulfilled = await tx.sponsorBillingCycle.findUnique({
    where: { paymentsId: payment.id },
  });
  if (fulfilled) return;

  await lock(tx, "sponsor-slots");
  if (await tx.slots.findFirst({ where: { userId: user.id } })) {
    throw new Error("User already owns a sponsor slot.");
  }
  if ((await tx.slots.count({ where: { isActive: true } })) >= 20) {
    throw new Error("No sponsor slots are available.");
  }

  const slot = await tx.slots.create({
    data: { userId: user.id, isActive: true },
    select: { id: true },
  });
  const startDate = new Date();
  await tx.sponsorBillingCycle.create({
    data: {
      userId: user.id,
      slotId: slot.id,
      paymentsId: payment.id,
      startDate,
      endDate: termFrom(startDate),
    },
  });
  await tx.user.update({
    where: { id: user.id },
    data: { role: "CUSTOMER" },
  });
}

async function processRenewal(tx: Tx, data: Success, metadata: Metadata) {
  const userId = required(metadata, "user_id");
  await lock(tx, `sponsor-customer:${userId}`);

  const user = await tx.user.findFirst({
    where: {
      id: userId,
      email: data.customer.email.trim().toLowerCase(),
      role: "CUSTOMER",
    },
    select: {
      sponsors: { select: { id: true } },
      slots: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { id: true, isActive: true },
      },
    },
  });
  const sponsor = user?.sponsors;
  const slot = user?.slots[0];
  if (!sponsor || !slot) throw new Error("Sponsor renewal target was not found.");

  const payment = await sponsorPayment(tx, data, userId);
  if (await tx.sponsorBillingCycle.findUnique({ where: { paymentsId: payment.id } })) {
    return;
  }

  await lock(tx, "sponsor-slots");
  const activeCycle = await tx.sponsorBillingCycle.findFirst({
    where: {
      slotId: slot.id,
      status: "ACTIVE",
      endDate: { gt: new Date() },
    },
    select: { id: true },
  });
  if (slot.isActive && activeCycle) {
    throw new Error("Sponsor slot and billing cycle are already active.");
  }

  const occupied = await tx.slots.count({
    where: { isActive: true, id: { not: slot.id } },
  });
  if (occupied >= 20) throw new Error("No sponsor slots are available.");

  const latest = await tx.sponsorBillingCycle.findFirst({
    where: { slotId: slot.id },
    orderBy: { endDate: "desc" },
    select: { endDate: true },
  });
  const now = new Date();
  const startDate = latest && latest.endDate > now ? latest.endDate : now;

  await tx.slots.update({
    where: { id: slot.id },
    data: { sponsorId: sponsor.id, isActive: true },
  });
  await tx.sponsorBillingCycle.create({
    data: {
      userId,
      sponsorId: sponsor.id,
      slotId: slot.id,
      paymentsId: payment.id,
      startDate,
      endDate: termFrom(startDate),
    },
  });
}

async function markVoteFailed(
  tx: Tx,
  event: Extract<Event, { type: "payment.failed" | "payment.cancelled" }>,
) {
  const metadata = metadataOf(event.data);
  if (payTypeOf(metadata) !== "vote") return;
  const userId = required(metadata, "user_id");
  const paymentId = required(metadata, "local_payment_id");
  await lock(tx, `payment:${paymentId}`);
  await tx.payment.updateMany({
    where: { id: paymentId, userId, status: { not: "COMPLETED" } },
    data: {
      status: event.type === "payment.failed" ? "FAILED" : "CANCELLED",
      dodoPaymentId: event.data.payment_id,
    },
  });
}

function unwrap(request: Request, body: string) {
  const id = request.headers.get("webhook-id");
  const signature = request.headers.get("webhook-signature");
  const timestamp = request.headers.get("webhook-timestamp");
  if (!id || !signature || !timestamp) throw new Error("Missing webhook headers.");
  return {
    id,
    event: dodopayments.webhooks.unwrap(body, {
      headers: {
        "webhook-id": id,
        "webhook-signature": signature,
        "webhook-timestamp": timestamp,
      },
    }),
  };
}

export async function POST(request: Request) {
  let verified: { id: string; event: Event };
  try {
    verified = unwrap(request, await request.text());
  } catch (error) {
    console.error("Dodo webhook verification failed", error);
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  try {
    await client.$transaction(async (tx) => {
      const record = await tx.paymentWebhookEvent.upsert({
        where: { eventId: verified.id },
        create: {
          eventId: verified.id,
          eventType: verified.event.type,
          payload: verified.event as unknown as Prisma.InputJsonValue,
        },
        update: {},
      });
      if (record.processed) return;

      const event = verified.event;
      if (event.type === "payment.succeeded") {
        const metadata = metadataOf(event.data);
        const paytype = payTypeOf(metadata);
        await lock(tx, `dodo-payment:${event.data.payment_id}`);
        if (paytype === "vote") await processVote(tx, event.data, metadata);
        if (paytype === "sponsor_new") await processNewSponsor(tx, event.data);
        if (paytype === "sponsor_renew") {
          await processRenewal(tx, event.data, metadata);
        }
      } else if (
        event.type === "payment.failed" ||
        event.type === "payment.cancelled"
      ) {
        await markVoteFailed(tx, event);
      }

      await tx.paymentWebhookEvent.update({
        where: { eventId: verified.id },
        data: { processed: true },
      });
    }, { timeout: 15_000 });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo webhook processing failed", {
      eventId: verified.id,
      eventType: verified.event.type,
      error,
    });
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
