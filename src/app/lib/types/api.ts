import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

export type AuthNextRequest = NextRequest & { auth: Session | null };
