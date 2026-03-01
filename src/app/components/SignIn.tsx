"use client";

import { signIn } from "next-auth/react";
import Button from "./shared/Button";

export default function SignIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-10 sm:px-8 sm:py-14">
      <div className="w-full max-w-lg rounded-lg border border-black bg-transparent p-6 shadow-md sm:p-8">
        <h1 className="mb-3 text-center text-3xl font-bold uppercase text-customPrimary">
          Neblir
        </h1>
        <h2 className="mb-6 text-center text-sm text-slate-700 sm:text-base">
          A homebrewed sci-fi TTRPG set in a starless world
        </h2>
      </div>
      <form
        className="mt-6 w-full max-w-lg"
        onSubmit={(event) => {
          event.preventDefault();
          void signIn("google", { callbackUrl: "/dashboard" });
        }}
      >
        <Button type="submit" text="Sign in with Google" />
      </form>
      <p className="mt-3 text-center text-xs text-slate-200">
        Works in desktop browsers and installable as a PWA.
      </p>
    </div>
  );
}
