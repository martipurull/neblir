'use client'

import { useEffect, useState } from "react"


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
        <h3>Players currently registered:</h3>
        <div>
          {players.map(player => (
            <p key={player.email}>{player.username}</p>
          ))}
        </div>
      </div>
    </main>
  );
}
