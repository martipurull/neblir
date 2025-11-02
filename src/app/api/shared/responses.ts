import { NextResponse } from "next/server";

export function errorResponse(
  message: string,
  status: number,
  details?: string
) {
  return NextResponse.json({ message, details }, { status });
}
