export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PaymentStatus } from "@prisma/client";

export async function POST(_: Request, ctx: { params: { id: string } }) {
  const id = ctx.params.id;

  const reqRow = await prisma.rideRequest.findUnique({ where: { id } });
  if (!reqRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.rideRequest.update({
    where: { id },
    data: { paymentStatus: PaymentStatus.SUBMITTED },
  });

  return NextResponse.json({ ok: true, row: updated });
}

