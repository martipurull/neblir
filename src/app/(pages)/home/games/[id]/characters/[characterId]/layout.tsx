import { resolveGameCharacterPageTitle } from "@/app/lib/pageMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type GameCharacterLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string; characterId: string }>;
};

export async function generateMetadata({
  params,
}: Pick<GameCharacterLayoutProps, "params">): Promise<Metadata> {
  const { id, characterId } = await params;
  return { title: await resolveGameCharacterPageTitle(id, characterId) };
}

export default function GameCharacterLayout({
  children,
}: GameCharacterLayoutProps) {
  return children;
}
