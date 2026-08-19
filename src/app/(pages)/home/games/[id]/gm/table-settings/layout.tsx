import { resolveGamePageTitle } from "@/app/lib/pageMetadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

type TableSettingsLayoutProps = {
  children: ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({
  params,
}: Pick<TableSettingsLayoutProps, "params">): Promise<Metadata> {
  const { id } = await params;
  const gameTitle = await resolveGamePageTitle(id);
  return { title: `Table Settings · ${gameTitle}` };
}

export default function TableSettingsLayout({
  children,
}: TableSettingsLayoutProps) {
  return children;
}
