import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { client } from "@/lib/db";
import { dodopayments } from "@/lib/dodopayments";
import { env } from "@/lib/env";
import { getPriceForVotes } from "@/lib/vote-price";
import {routing} from '@/i18n/routing';

export const runtime = "nodejs";

const MAX_PURCHASE_VOTES = 10_000;
const SPONSOR_PRICE_USD = 100;

const checkoutSchema = z.discriminatedUnion("purchaseType", [
  z.object({
    purchaseType: z.literal("VOTE"),
    countryId: z.uuid(),
    voteCount: z.number().int().min(1).max(MAX_PURCHASE_VOTES),
    voteType: z.enum(["UPVOTE", "DOWNVOTE"]),
    locale: z.enum(routing.locales).default('en'),
  }),
  z.object({
    purchaseType: z.literal("SPONSOR"),
    locale: z.enum(routing.locales).default('en'),
  }),
]);

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(env.NEXT_PUBLIC_APP_BASE_URL).origin
  ) {
    return errorResponse("Checkout requests must come from this website.", 403);
  }

  const parsed = checkoutSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout request.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const appUrl = `${env.NEXT_PUBLIC_APP_BASE_URL.replace(/\/$/, '')}/${input.locale}`;

  if (input.purchaseType === "SPONSOR") {
    const activeSlotCount = await client.slots.count({
      where: { isActive: true },
    });
    if (activeSlotCount >= 20) {
      return errorResponse("All sponsor slots are currently occupied.", 409);
    }

    try {
      const checkout = await dodopayments.checkoutSessions.create({
        product_cart: [
          {
            product_id: env.DODO_PAYMENTS_SPONSOR_PID,
            quantity: 1,
            amount: SPONSOR_PRICE_USD * 100,
          },
        ],
        return_url: `${appUrl}/sponsor?checkout=success`,
        cancel_url: `${appUrl}/?checkout=cancelled`,
        customization: { theme: "dark" },
        metadata: {
          isSponsor: true,
          purchase_type: "SPONSOR",
        },
      });

      if (!checkout.checkout_url) {
        throw new Error("Dodo Payments did not return a checkout URL.");
      }

      return NextResponse.json({ checkoutUrl: checkout.checkout_url });
    } catch (error) {
      console.error("Unable to create sponsor checkout", error);
      return errorResponse("Could not start checkout.", 502);
    }
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return errorResponse("Sign in before purchasing votes.", 401);

  const [user, country] = await Promise.all([
    client.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, name: true },
    }),
    client.country.findUnique({
      where: { id: input.countryId },
      select: { id: true },
    }),
  ]);

  if (!user) return errorResponse("User not found.", 404);
  if (!country) return errorResponse("Country not found.", 404);

  const purchase = getPriceForVotes(input.voteCount);
  const payment = await client.payment.create({
    data: {
      userId: user.id,
      amount: purchase.price,
      currency: "USD",
      voteQuantity: purchase.voteCount,
      transaction: { create: {} },
    },
    select: { id: true },
  });

  try {
    const checkout = await dodopayments.checkoutSessions.create({
      product_cart: [
        {
          product_id: env.DODO_PAYMENTS_VOTE_PID,
          quantity: 1,
          amount: Math.round(purchase.price * 100),
        },
      ],
      customer: {
        email: user.email,
        name: user.name,
      },
      feature_flags: {
        always_create_new_customer:
          env.DODO_PAYMENTS_ENVIRONMENT === "test_mode",
      },
      return_url: `${appUrl}/?checkout=success`,
      cancel_url: `${appUrl}/?checkout=cancelled`,
      customization: { theme: "dark" },
      metadata: {
        isSponsor: false,
        purchase_type: "VOTE",
        user_id: user.id,
        local_payment_id: payment.id,
        country_id: country.id,
        vote_count: purchase.voteCount,
        vote_type: input.voteType,
      },
    });

    if (!checkout.checkout_url) {
      throw new Error("Dodo Payments did not return a checkout URL.");
    }

    return NextResponse.json({ checkoutUrl: checkout.checkout_url });
  } catch (error) {
    await client.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
    console.error("Unable to create vote checkout", error);

    return errorResponse("Could not start checkout.", 502);
  }
}
