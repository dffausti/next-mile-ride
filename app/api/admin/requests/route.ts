export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertAdminAccess } from "@/lib/adminGuard";

export async function GET(req: NextRequest) {
  const access = assertAdminAccess(req);
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  try {
    const rows = await prisma.rideRequest.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        fullName: true,
        tripType: true,
        pickupAddress: true,
        destinationAddress: true,
        pickupDateTime: true,
        distanceMiles: true,
        partySize: true,
        paymentMethod: true,
        paymentSubmitted: true,
        paymentSubmittedAt: true,
        paymentConfirmed: true,
        paymentConfirmedAt: true,
      },
    });

    return NextResponse.json({ ok: true, rows }, { status: 200 });
  } catch (err: any) {
    console.error("GET /api/admin/requests error:", err);
    return NextResponse.json(
      { error: "Failed to load requests", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

