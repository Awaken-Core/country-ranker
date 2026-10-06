import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { client } from "@/lib/db";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

const sponsorSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z
    .string()
    .trim()
    .max(180)
    .transform((value) => value || null),
  logo: z.string().trim().min(1).max(500),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  website: z.url().max(500),
});

async function getCustomer(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return null;

  return client.user.findFirst({
    where: { id: session.user.id, role: "CUSTOMER" },
    select: { id: true },
  });
}

function forbidden() {
  return NextResponse.json(
    { error: "Customer access is required." },
    { status: 403 },
  );
}

function invalidOrigin(request: Request) {
  return (
    request.headers.get("origin") !==
    new URL(env.NEXT_PUBLIC_APP_BASE_URL).origin
  );
}

function sponsorSelect() {
  return {
    id: true,
    name: true,
    description: true,
    logo: true,
    bgColor: true,
    textColor: true,
    website: true,
    slots: {
      where: { isActive: true },
      take: 1,
      select: {
        id: true,
        isActive: true,
        sponsorBillingCycles: {
          where: { status: "ACTIVE" as const },
          orderBy: { endDate: "desc" as const },
          take: 1,
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    },
  };
}

export async function GET(request: Request) {
  const customer = await getCustomer(request);
  if (!customer) return forbidden();

  const sponsor = await client.sponsor.findUnique({
    where: { userId: customer.id },
    select: sponsorSelect(),
  });

  return NextResponse.json(
    { sponsor },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (invalidOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  const customer = await getCustomer(request);
  if (!customer) return forbidden();

  const parsed = sponsorSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid sponsor details.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const sponsor = await client.$transaction(async (tx) => {
    const savedSponsor = await tx.sponsor.upsert({
      where: { userId: customer.id },
      create: { ...parsed.data, userId: customer.id },
      update: parsed.data,
      select: { id: true },
    });

    const reservedSlot = await tx.slots.findFirst({
      where: { userId: customer.id, sponsorId: null },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (reservedSlot) {
      await tx.slots.update({
        where: { id: reservedSlot.id },
        data: { sponsorId: savedSponsor.id },
      });
      await tx.sponsorBillingCycle.updateMany({
        where: { userId: customer.id, slotId: reservedSlot.id, sponsorId: null },
        data: { sponsorId: savedSponsor.id },
      });
    }

    return tx.sponsor.findUniqueOrThrow({
      where: { id: savedSponsor.id },
      select: sponsorSelect(),
    });
  });

  return NextResponse.json({ sponsor }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (invalidOrigin(request)) {
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  }

  const customer = await getCustomer(request);
  if (!customer) return forbidden();

  const parsed = sponsorSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid sponsor details.", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const updated = await client.sponsor.updateMany({
    where: { userId: customer.id },
    data: parsed.data,
  });
  if (!updated.count) {
    return NextResponse.json(
      { error: "Sponsor profile not found." },
      { status: 404 },
    );
  }

  const sponsor = await client.sponsor.findUnique({
    where: { userId: customer.id },
    select: sponsorSelect(),
  });

  return NextResponse.json({ sponsor });
}
