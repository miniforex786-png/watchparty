import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "watchparty-frontend",
    timestamp: Date.now()
  });
}
