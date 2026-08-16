export function gameMasterPath(gameId: string): string {
  return `/home/games/${encodeURIComponent(gameId)}/gm`;
}

export function gameMasterTableSettingsPath(gameId: string): string {
  return `${gameMasterPath(gameId)}/table-settings`;
}
