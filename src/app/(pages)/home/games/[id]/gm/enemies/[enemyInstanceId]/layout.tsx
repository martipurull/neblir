import { resolveEnemyInstancePageTitle } from "@/app/lib/pageMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type EnemyInstanceLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string; enemyInstanceId: string }>;
};

export async function generateMetadata({
  params,
}: Pick<EnemyInstanceLayoutProps, "params">): Promise<Metadata> {
  const { id, enemyInstanceId } = await params;
  return { title: await resolveEnemyInstancePageTitle(id, enemyInstanceId) };
}

export default function EnemyInstanceLayout({
  children,
}: EnemyInstanceLayoutProps) {
  return children;
}
