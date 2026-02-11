import { NextResponse } from "next/server";

export function GET() {
  const body = `User-agent: *
Disallow: /admin
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

