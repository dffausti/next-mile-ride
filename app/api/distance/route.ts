import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.origin || !body?.destination) {
      return NextResponse.json(
        { error: "origin and destination are required" },
        { status: 400 }
      );
    }

    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Missing GOOGLE_MAPS_API_KEY in .env.local" },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      origins: body.origin,
      destinations: body.destination,
      key,
      units: "imperial",
    });

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
    const resp = await fetch(url);

    // Google usually returns JSON even on errors; if it doesn't, handle text safely
    const text = await resp.text();
    let data: any = null;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    // If Google returns an API-level failure, it appears in data.status/message
    if (!resp.ok) {
      return NextResponse.json(
        { error: "Google Distance Matrix HTTP error", google: data },
        { status: 502 }
      );
    }

    if (data?.status && data.status !== "OK") {
      return NextResponse.json(
        {
          error: "Google Distance Matrix API error",
          google_status: data.status,
          google_message: data.error_message ?? null,
          google: data,
        },
        { status: 502 }
      );
    }

    const element = data?.rows?.[0]?.elements?.[0];
    if (!element || element.status !== "OK") {
      return NextResponse.json(
        {
          error: "No route found or invalid address",
          element_status: element?.status ?? "UNKNOWN",
          google: data,
        },
        { status: 400 }
      );
    }

    const meters = element.distance.value as number;
    const miles = meters / 1609.344;

    return NextResponse.json({
      miles: Math.round(miles * 10) / 10,
      durationText: element.duration?.text ?? null,
      distanceText: element.distance?.text ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Server error in /api/distance", details: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}

