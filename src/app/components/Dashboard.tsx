"use client";

import GameInvitesReceivedBlock from "@/app/components/games/GameInvitesReceivedBlock";
import { useGameInvites } from "@/hooks/use-game-invites";
import { useGames } from "@/hooks/use-games";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

const Dashboard: React.FC = () => {
  const { invites, mutate: mutateInvites } = useGameInvites();
  const { mutate: mutateGames } = useGames();
  const router = useRouter();
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [decliningId, setDecliningId] = useState<string | null>(null);

  const handleAccept = async (gameId: string) => {
    setAcceptingId(gameId);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/invites/accept`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to accept");
      void mutateInvites();
      void mutateGames();
      router.push(`/home/games/${gameId}`);
    } finally {
      setAcceptingId(null);
    }
  };

  const handleDecline = async (gameId: string) => {
    setDecliningId(gameId);
    try {
      const res = await fetch(
        `/api/games/${encodeURIComponent(gameId)}/invites/decline`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to decline");
      void mutateInvites();
    } finally {
      setDecliningId(null);
    }
  };

  const tabs = [
    { label: "Settings", link: "/home/settings" },
    { label: "Characters", link: "/home/characters" },
    { label: "Games", link: "/home/games" },
    { label: "Mechanics", link: "/home/mechanics" },
    { label: "World", link: "/home/world" },
    { label: "Dice Roller", link: "/home/dice-roller" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <h2 className="mb-6 text-center text-2xl font-bold text-black sm:mb-8 sm:text-3xl">
        Dashboard
      </h2>

      <GameInvitesReceivedBlock
        invites={invites}
        acceptingId={acceptingId}
        decliningId={decliningId}
        onAccept={(gameId: string) => void handleAccept(gameId)}
        onDecline={(gameId: string) => void handleDecline(gameId)}
        showGamesLink
      />

      <div>
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.link}
            className="mb-6 block rounded-lg border border-black bg-transparent p-4 text-lg font-semibold text-black transition-colors duration-500 ease-in-out sm:mb-8 sm:p-6 sm:text-xl md:hover:bg-paleBlue/30"
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
