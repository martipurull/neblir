'use client'

import { useEffect, useState } from "react"
import LoginPage from "./pages/login/page"


export default function Home() {
  const [players, setPlayers] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/players')
      .then(response => response.json())
      .then(data => setPlayers(data.players))
      .catch(error => console.error('Error fetching players', error))
  }, [])

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div>
        <h1 className="text-3xl font-bold uppercase">Neblir</h1>
        <h2>A homebrewed sci-fi TTRPG set in a starless world</h2>
        {/* 
        @todo
        If logged in, show the dashboard
        If not logged in, show the login/signup form
         */}
        <LoginPage />
      </div>
    </main>
  );
}
