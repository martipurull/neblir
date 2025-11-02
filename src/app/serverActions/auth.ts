"use server";
import { signIn } from "@/auth";

export async function authSignIn(provider: string, redirectTo?: string) {
  await signIn(provider, { redirectTo: redirectTo });
}
