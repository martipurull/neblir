import { resolveGamePageTitle } from "@/app/lib/pageMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type GameIdLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Pick<GameIdLayoutProps, "params">): Promise<Metadata> {
  const { id } = await params;
  return { title: await resolveGamePageTitle(id) };
}

export default function GameIdLayout({ children }: GameIdLayoutProps) {
  return children;
}
