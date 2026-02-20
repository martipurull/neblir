"use client";

import LoginPage from "./(pages)/signin/page";
import DashboardPage from "./(pages)/dashboard/page";

import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { getSession } from "next-auth/react";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      const session = await getSession();
      setSession(session);
      setIsLoading(false);
    }
    fetchSession();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      {session ? <DashboardPage /> : <LoginPage />}
    </main>
  );
}
