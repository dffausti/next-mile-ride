export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminAccess } from "@/lib/adminGuard";

export async function POST(req: NextRequest) {
  const access = assertAdminAccess(req);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    // URL: /api/admin/requests/<id>/confirm-payment
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[3]; // ["api","admin","requests","<id>","confirm-payment"]

    if (!id) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const updated = await prisma.rideRequest.update({
      where: { id },
      data: {
        paymentConfirmed: true,
        paymentConfirmedAt: new Date(),
      },
      select: {
        id: true,
        paymentSubmitted: true,
        paymentSubmittedAt: true,
        paymentConfirmed: true,
        paymentConfirmedAt: true,
      },
    });

    return NextResponse.json({ ok: true, request: updated }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/admin/requests/[id]/confirm-payment error:", err);
    return NextResponse.json(
      { error: "Failed to confirm payment", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

