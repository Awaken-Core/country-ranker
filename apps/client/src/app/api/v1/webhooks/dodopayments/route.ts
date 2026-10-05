import { randomUUID } from "node:crypto";
import { Prisma, type Payment } from "@prisma/client";
import { NextResponse } from "next/server";
import { client } from "@/lib/db";
import { dodopayments } from "@/lib/dodopayments";

export const runtime = "nodejs";

type TransactionClient = Prisma.TransactionClient;
type Metadata = Record<string, string | number | boolean>;

function readMetadata(data: unknown): Metadata {
  if (!data || typeof data !== "object" || !("metadata" in data)) return {};
  const metadata = data.metadata;
  return metadata && typeof metadata === "object" ? (metadata as Metadata) : {};
}

function readString(metadata: Metadata, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isSponsorPurchase(metadata: Metadata) {
  return (
    metadata.isSponsor === true ||
    metadata.isSponsor === "true" ||
    metadata.purchase_type === "SPONSOR"
  );
}

async function createPaymentLog(tx: TransactionClient, payment: Payment) {
  await tx.userPaymentLog.create({
    data: {
      userId: payment.userId,
      paymentId: payment.id,
      purchasedAmount: payment.amount,
      currency: payment.currency,
    },
  });
}

async function fulfillVotePurchase(
  tx: TransactionClient,
  payment: Payment,
  metadata: Metadata,
) {
  const countryId = readString(metadata, "country_id");
  const voteType = readString(metadata, "vote_type");
  const voteQuantity = payment.voteQuantity;

  if (
    !countryId ||
    !voteQuantity ||
    voteQuantity <= 0 ||
    (voteType !== "UPVOTE" && voteType !== "DOWNVOTE")
  ) {
    throw new Error("Vote payment is missing its purchase snapshot.");
  }

  const country = await tx.country.findUnique({
    where: { id: countryId },
    select: { id: true },
  });
  if (!country) throw new Error("Vote payment country no longer exists.");

  await tx.country.update({
    where: { id: country.id },
    data:
      voteType === "UPVOTE"
        ? { totalUpvoteCount: { increment: voteQuantity } }
        : { totalDownvoteCount: { increment: voteQuantity } },
  });

  await tx.voteLog.create({
    data: {
      userId: payment.userId,
      countryId: country.id,
      voteType,
      voteIntentionType: "PURCHASED",
      count: voteQuantity,
      requestId: `payment:${payment.id}`,
      result: {
        paymentId: payment.id,
        fulfilledBy: "DODO_PAYMENTS_WEBHOOK",
      },
      paidDetail: {
        create: {
          userId: payment.userId,
          countryId: country.id,
          voteType,
          count: voteQuantity,
        },
      },
    },
  });
}

async function recordSponsorPayment(
  tx: TransactionClient,
  paymentData: Extract<
    ReturnType<typeof dodopayments.webhooks.unwrap>,
    { type: "payment.succeeded" }
  >["data"],
) {
  const email = paymentData.customer.email.trim().toLowerCase();
  const name =
    paymentData.customer.name.trim() || email.split("@", 1)[0] || "Customer";

  if (!email) throw new Error("Sponsor payment is missing a customer email.");

  const user = await tx.user.upsert({
    where: { email },
    create: {
      id: randomUUID(),
      email,
      name,
      role: "CUSTOMER",
    },
    update: {},
    select: { id: true },
  });

  await tx.user.updateMany({
    where: { id: user.id, role: "USER" },
    data: { role: "CUSTOMER" },
  });

  const existingPayment = await tx.payment.findUnique({
    where: { dodoPaymentId: paymentData.payment_id },
  });
  if (existingPayment) return;

  const payment = await tx.payment.create({
    data: {
      userId: user.id,
      dodoPaymentId: paymentData.payment_id,
      amount: paymentData.total_amount / 100,
      currency: paymentData.currency,
      status: "COMPLETED",
      transaction: { create: {} },
    },
  });

  await createPaymentLog(tx, payment);
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const webhookId = request.headers.get("webhook-id");
  const webhookSignature = request.headers.get("webhook-signature");
  const webhookTimestamp = request.headers.get("webhook-timestamp");

  if (!webhookId || !webhookSignature || !webhookTimestamp) {
    return NextResponse.json(
      { error: "Missing webhook headers." },
      { status: 400 },
    );
  }

  let event: ReturnType<typeof dodopayments.webhooks.unwrap>;
  try {
    event = dodopayments.webhooks.unwrap(rawBody, {
      headers: {
        "webhook-id": webhookId,
        "webhook-signature": webhookSignature,
        "webhook-timestamp": webhookTimestamp,
      },
    });
  } catch (error) {
    console.error("Dodo webhook signature verification failed", {
      reason: error instanceof Error ? error.message : "Unknown error",
      webhookId,
      webhookTimestamp,
      signatureVersions: webhookSignature
        .split(" ")
        .map((signature) => signature.split(",", 1)[0]),
    });

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  try {
    await client.$transaction(
      async (tx) => {
        const webhookEvent = await tx.paymentWebhookEvent.upsert({
          where: { eventId: webhookId },
          create: {
            eventId: webhookId,
            eventType: event.type,
            payload: event as unknown as Prisma.InputJsonValue,
          },
          update: {},
        });

        if (webhookEvent.processed) return;

        if (event.type === "payment.succeeded") {
          const metadata = readMetadata(event.data);
          const sponsorPurchase = isSponsorPurchase(metadata);

          if (sponsorPurchase) {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${event.data.payment_id}, 0))`;
            await recordSponsorPayment(tx, event.data);
          } else {
            const userId = readString(metadata, "user_id");
            const localPaymentId = readString(metadata, "local_payment_id");

            if (!userId || !localPaymentId) {
              throw new Error("Vote payment is missing local identifiers.");
            }

            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${localPaymentId}, 0))`;

            const payment = await tx.payment.findFirst({
              where: { id: localPaymentId, userId },
            });
            if (!payment) throw new Error("Local payment was not found.");
            if (payment.voteQuantity === null) {
              throw new Error("Vote payment is missing its vote quantity.");
            }

            if (payment.status !== "COMPLETED") {
              await fulfillVotePurchase(tx, payment, metadata);
              await createPaymentLog(tx, payment);
              await tx.payment.update({
                where: { id: payment.id },
                data: {
                  status: "COMPLETED",
                  dodoPaymentId: event.data.payment_id,
                },
              });
            }
          }
        } else if (
          event.type === "payment.failed" ||
          event.type === "payment.cancelled"
        ) {
          const metadata = readMetadata(event.data);

          if (!isSponsorPurchase(metadata)) {
            const userId = readString(metadata, "user_id");
            const localPaymentId = readString(metadata, "local_payment_id");

            if (!userId || !localPaymentId) {
              throw new Error("Vote payment is missing local identifiers.");
            }

            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${localPaymentId}, 0))`;

            await tx.payment.updateMany({
              where: {
                id: localPaymentId,
                userId,
                status: { not: "COMPLETED" },
              },
              data: {
                status:
                  event.type === "payment.failed" ? "FAILED" : "CANCELLED",
                dodoPaymentId: event.data.payment_id,
              },
            });
          }
        }

        await tx.paymentWebhookEvent.update({
          where: { eventId: webhookId },
          data: { processed: true },
        });
      },
      { timeout: 15_000 },
    );

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo Payments webhook processing failed", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
