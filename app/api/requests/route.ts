export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Normalize inputs to match your Prisma schema.
 * If your schema uses enums, this prevents 500s from invalid enum values.
 */
function normalizeTripType(v: unknown) {
  const s = String(v ?? "");
  // Common schema options:
  // - "Work/Job" or "WORK_JOB"
  // - "Tourism/Tour" or "TOURISM_TOUR"
  if (s === "Work/Job" || s === "WORK_JOB") return "WORK_JOB";
  if (s === "Tourism/Tour" || s === "TOURISM_TOUR") return "TOURISM_TOUR";
  // fallback
  return "WORK_JOB";
}

function normalizePaymentMethod(v: unknown) {
  const s = String(v ?? "");
  if (s === "Zelle" || s === "ZELLE") return "ZELLE";
  if (s === "CashApp" || s === "CASHAPP") return "CASHAPP";
  if (s === "PayPal" || s === "PAYPAL") return "PAYPAL";
  return "ZELLE";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Basic required fields
    const fullName = String(body.fullName ?? "").trim();
    const dobRaw = body.dob;
    const pickupAddress = String(body.pickupAddress ?? "").trim();
    const destinationAddress = String(body.destinationAddress ?? "").trim();
    const pickupDateTimeRaw = body.pickupDateTime;

    if (!fullName || !dobRaw || !pickupAddress || !destinationAddress || !pickupDateTimeRaw) {
      return NextResponse.json(
        { error: "Missing required fields (fullName, dob, pickupAddress, destinationAddress, pickupDateTime)" },
        { status: 400 }
      );
    }

    const dob = new Date(dobRaw);
    const pickupDateTime = new Date(pickupDateTimeRaw);
    const returnDateTime = body.returnDateTime ? new Date(body.returnDateTime) : null;

    if (Number.isNaN(dob.getTime())) {
      return NextResponse.json({ error: "Invalid dob format" }, { status: 400 });
    }
    if (Number.isNaN(pickupDateTime.getTime())) {
      return NextResponse.json({ error: "Invalid pickupDateTime format" }, { status: 400 });
    }
    if (returnDateTime && Number.isNaN(returnDateTime.getTime())) {
      return NextResponse.json({ error: "Invalid returnDateTime format" }, { status: 400 });
    }

    // Optional fields
    const partySize = Number(body.partySize ?? 1);
    const distanceMiles =
      body.distanceMiles === null || body.distanceMiles === undefined
        ? null
        : Number(body.distanceMiles);

    const photoIdFileName = body.photoIdFileName ? String(body.photoIdFileName) : null;
    const selfieFileName = body.selfieFileName ? String(body.selfieFileName) : null;

    const tripType = normalizeTripType(body.tripType);
    const paymentMethod = normalizePaymentMethod(body.paymentMethod);

    const ackOnTime = Boolean(body.ackOnTime);
    const ackPayment24h = Boolean(body.ackPayment24h);
    const ackCancelFee = Boolean(body.ackCancelFee);

    // Create record
    const created = await prisma.rideRequest.create({
      data: {
        fullName,
        dob,
        tripType: tripType as any, // supports enum or string schema
        pickupAddress,
        destinationAddress,
        pickupDateTime,
        returnDateTime,
        partySize,
        distanceMiles,

        photoIdFileName,
        selfieFileName,

        paymentMethod: paymentMethod as any, // supports enum or string schema
        ackOnTime,
        ackPayment24h,
        ackCancelFee,
      },
    });

    return NextResponse.json({ ok: true, id: created.id }, { status: 200 });
  } catch (err: any) {
    // ✅ This is the key: return useful error details for debugging
    console.error("POST /api/requests error:", err);

    return NextResponse.json(
      {
        error: "Server error creating request",
        details: String(err?.message ?? err),
        code: err?.code ?? null,
      },
      { status: 500 }
    );
  }
}

