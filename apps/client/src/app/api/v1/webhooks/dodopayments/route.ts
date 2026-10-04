import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { client } from "@/lib/db";
import { dodopayments } from "@/lib/dodopayments";

export const runtime = "nodejs";

function readMetadata(data: unknown) {
  if (!data || typeof data !== "object" || !("metadata" in data))
    return {} as Record<string, string>;
  const metadata = data.metadata;
  return metadata && typeof metadata === "object"
    ? (metadata as Record<string, string>)
    : ({} as Record<string, string>);
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
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 401 },
    );
  }

  const existing = await client.dodoWebhookEvent.findUnique({
    where: { eventId: webhookId },
  });
  if (existing?.processed) return NextResponse.json({ received: true });

  await client.dodoWebhookEvent.upsert({
    where: { eventId: webhookId },
    create: {
      eventId: webhookId,
      eventType: event.type,
      payload: event as unknown as Prisma.InputJsonValue,
    },
    update: {},
  });

  try {
    await client.$transaction(async (tx) => {
      const metadata = readMetadata(event.data);
      const userId = metadata.user_id;
      const pricingId = metadata.pricing_id;
      const localPaymentId = metadata.local_payment_id;

      if (
        event.type === "payment.succeeded" &&
        userId &&
        pricingId &&
        localPaymentId
      ) {
        const payment = await tx.payment.findFirst({
          where: {
            id: localPaymentId,
            userId,
            transaction: { pricingId },
          },
          include: { transaction: { include: { pricing: true } } },
        });

        if (payment && payment.status !== "COMPLETED" && payment.transaction) {
          const pricing = payment.transaction.pricing;
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "COMPLETED", dodoPaymentId: event.data.payment_id },
          });

          const userCredits = await tx.userCredits.upsert({
            where: { userId },
            update: { totalCredits: { increment: pricing.credits } },
            create: { userId, totalCredits: pricing.credits },
          });

          await tx.user.update({
            where: { id: userId },
            data: { isPremium: true },
          });
          await tx.userPurchaseLog.create({
            data: {
              userId,
              pricingId: pricing.id,
              paymentId: payment.id,
              purchasedCredits: pricing.credits,
              purchasedAmount: payment.amount,
              currency: payment.currency,
            },
          });
          await tx.creditLog.create({
            data: {
              userId,
              creditId: userCredits.id,
              pricingId: pricing.id,
              credits: pricing.credits,
              creditsOps: "ADDED",
              source: `payment:${payment.id}`,
            },
          });
        }
      } else if (event.type === "payment.failed" && userId && localPaymentId) {
        await tx.payment.updateMany({
          where: { id: localPaymentId, userId, status: { not: "COMPLETED" } },
          data: { status: "FAILED", dodoPaymentId: event.data.payment_id },
        });
      }

      await tx.dodoWebhookEvent.update({
        where: { eventId: webhookId },
        data: { processed: true },
      });
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Dodo Payments webhook processing failed", error);
    return NextResponse.json(
      { error: "Webhook processing failed." },
      { status: 500 },
    );
  }
}
