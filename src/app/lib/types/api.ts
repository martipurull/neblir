import { NextRequest } from "next/server";
import { Session } from "next-auth";

export type AuthNextRequest = NextRequest & { auth: Session | null }