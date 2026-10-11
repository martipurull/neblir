import { redirect } from "next/navigation";

/**
 * Index URL for /gm/enemies (no instance id). Existing links still resolve
 * here and land on the Game master page. The enemies UI lives on that page.
 */
export default async function GmEnemiesIndexPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);
  redirect(`/home/games/${id}/gm`);
}
