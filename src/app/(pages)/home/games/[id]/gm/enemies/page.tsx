import { redirect } from "next/navigation";

/**
 * Index URL for /gm/enemies (no instance id). The shell BackButton strips the last
 * segment from instance pages and lands here — without this route that navigation 404s.
 * The enemies UI lives on the GM page.
 */
export default async function GmEnemiesIndexPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  const { id } = await Promise.resolve(params);
  redirect(`/home/games/${id}/gm`);
}
