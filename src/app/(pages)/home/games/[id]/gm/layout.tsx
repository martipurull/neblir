import { resolveGamePageTitle } from "@/app/lib/pageMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type GameMasterLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Pick<GameMasterLayoutProps, "params">): Promise<Metadata> {
  const { id } = await params;
  const gameTitle = await resolveGamePageTitle(id);
  return { title: `Game Master · ${gameTitle}` };
}

export default function GameMasterLayout({ children }: GameMasterLayoutProps) {
  return children;
}
