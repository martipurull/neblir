'use client'

import { auth } from "@/auth";
import LoginPage from "./(pages)/signin/page"


import { useEffect, useState } from "react";
import { Session } from "next-auth";
import DashboardPage from "./(pages)/dashboard/page";

export default function Home() {
  const [session, setSession] = useState<null | Session>(null);

  useEffect(() => {
    async function fetchSession() {
      const sessionData = await auth();
      console.log('user: ', sessionData?.user);
      setSession(sessionData);
    }
    fetchSession();
  }, []);

  return (
    <main>
      {
        session
          ? <DashboardPage />
          : <LoginPage />
      }
    </main>
  );
}
