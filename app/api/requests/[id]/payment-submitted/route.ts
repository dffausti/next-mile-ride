export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Parse id from URL: /api/requests/<id>/payment-submitted
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const id = parts[2]; // ["api","requests","<id>","payment-submitted"]

    if (!id) {
      return NextResponse.json({ error: "Missing request id" }, { status: 400 });
    }

    const updated = await prisma.rideRequest.update({
      where: { id },
      data: {
        paymentSubmitted: true,
        paymentSubmittedAt: new Date(),
      },
      select: {
        id: true,
        paymentSubmitted: true,
        paymentSubmittedAt: true,
      },
    });

    return NextResponse.json({ ok: true, request: updated }, { status: 200 });
  } catch (err: any) {
    console.error("POST /api/requests/[id]/payment-submitted error:", err);
    return NextResponse.json(
      { error: "Failed to mark payment submitted", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

