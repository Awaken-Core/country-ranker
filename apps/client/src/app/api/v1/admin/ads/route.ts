import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { client } from "@/lib/db";
import { adminService } from "@/modules/admin/admin.service";

const CAPACITY = 20;

const adSchema = z.object({
  position: z.number().int().min(1).max(CAPACITY),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(180).transform((value) => value || null),
  logo: z.url().max(500),
  website: z.url().max(500),
  bgColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isActive: z.boolean(),
});

const reorderSchema = z.object({
  sourcePosition: z.number().int().min(1).max(CAPACITY),
  targetPosition: z.number().int().min(1).max(CAPACITY),
});

async function actor(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) return null;
  const access = await adminService.verifyAccess(session.user.id, "ADS_MANAGE");
  return access.authorized ? session.user : null;
}

export async function GET(request: Request) {
  const user = await actor(request);
  if (!user) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const slots = await client.slots.findMany({
    where: { position: { not: null } },
    orderBy: { position: "asc" },
    select: {
      id: true,
      position: true,
      isActive: true,
      user: { select: { name: true, email: true } },
      sponsor: {
        select: {
          id: true,
          name: true,
          description: true,
          logo: true,
          website: true,
          bgColor: true,
          textColor: true,
        },
      },
    },
  });
  const byPosition = new Map(slots.flatMap((slot) => slot.position ? [[slot.position, slot]] : []));
  const positions = Array.from({ length: CAPACITY }, (_, index) => {
    const position = index + 1;
    const slot = byPosition.get(position);
    return {
      position,
      slotId: slot?.id ?? null,
      isActive: slot?.isActive ?? false,
      sponsor: slot?.sponsor ?? null,
      reservation: slot && !slot.sponsor ? slot.user : null,
    };
  });

  return NextResponse.json({ capacity: CAPACITY, positions }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  const user = await actor(request);
  if (!user) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = adSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid advertisement details.", details: parsed.error.flatten() }, { status: 422 });
  }
  const input = parsed.data;
  const existingSlot = await client.slots.findUnique({
    where: { position: input.position },
    select: { sponsorId: true, userId: true },
  });
  if (existingSlot && !existingSlot.sponsorId && existingSlot.userId !== user.id) {
    return NextResponse.json(
      { error: "This position is reserved for a customer who has not completed their ad profile." },
      { status: 409 },
    );
  }
  const sponsorData = {
    name: input.name,
    description: input.description,
    logo: input.logo,
    website: input.website,
    bgColor: input.bgColor,
    textColor: input.textColor,
  };

  const result = await client.$transaction(async (tx) => {
    const slot = await tx.slots.findUnique({
      where: { position: input.position },
      select: { id: true, sponsorId: true },
    });
    let slotId: string;
    let sponsorId: string;
    if (slot?.sponsorId) {
      slotId = slot.id;
      sponsorId = slot.sponsorId;
      await tx.sponsor.update({ where: { id: sponsorId }, data: sponsorData });
      await tx.slots.update({ where: { id: slotId }, data: { isActive: input.isActive } });
    } else {
      const sponsor = await tx.sponsor.create({
        data: {
          ...sponsorData,
        },
      });
      sponsorId = sponsor.id;
      if (slot) {
        slotId = slot.id;
        await tx.slots.update({
          where: { id: slotId },
          data: { sponsorId, isActive: input.isActive },
        });
      } else {
        const created = await tx.slots.create({
          data: { userId: user.id, sponsorId, position: input.position, isActive: input.isActive },
          select: { id: true },
        });
        slotId = created.id;
      }
    }
    return { slotId, sponsorId };
  });

  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "SAVE_ADVERTISEMENT",
      targetType: "SPONSOR_SLOT",
      targetId: result.slotId,
      details: { position: input.position, sponsorId: result.sponsorId, isActive: input.isActive },
    },
  });
  return NextResponse.json({ success: true, ...result });
}

export async function PATCH(request: Request) {
  const user = await actor(request);
  if (!user) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const parsed = reorderSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.sourcePosition === parsed.data.targetPosition) {
    return NextResponse.json({ error: "Choose two different valid positions." }, { status: 422 });
  }
  const { sourcePosition, targetPosition } = parsed.data;

  const moved = await client.$transaction(async (tx) => {
    const source = await tx.slots.findUnique({
      where: { position: sourcePosition },
      select: { id: true, sponsorId: true },
    });
    if (!source?.sponsorId) throw new Error("Only an occupied advertisement position can be moved.");

    const target = await tx.slots.findUnique({
      where: { position: targetPosition },
      select: { id: true },
    });
    if (target) {
      // The unique position index requires a temporary value while swapping.
      await tx.slots.update({ where: { id: source.id }, data: { position: -sourcePosition } });
      await tx.slots.update({ where: { id: target.id }, data: { position: sourcePosition } });
      await tx.slots.update({ where: { id: source.id }, data: { position: targetPosition } });
    } else {
      await tx.slots.update({ where: { id: source.id }, data: { position: targetPosition } });
    }
    return { slotId: source.id, sponsorId: source.sponsorId };
  });

  await client.auditLog.create({
    data: {
      userId: user.id,
      action: "MOVE_ADVERTISEMENT",
      targetType: "SPONSOR_SLOT",
      targetId: moved.slotId,
      details: { sourcePosition, targetPosition, sponsorId: moved.sponsorId },
    },
  });
  return NextResponse.json({ success: true, ...moved });
}
