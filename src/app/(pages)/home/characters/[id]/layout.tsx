import { resolveOwnedCharacterPageTitle } from "@/app/lib/pageMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type CharacterIdLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Pick<CharacterIdLayoutProps, "params">): Promise<Metadata> {
  const { id } = await params;
  return { title: await resolveOwnedCharacterPageTitle(id) };
}

export default function CharacterIdLayout({
  children,
}: CharacterIdLayoutProps) {
  return children;
}
