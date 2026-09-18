export function characterJsonForCaller<T extends { notes?: unknown }>(
  character: T,
  isOwner: boolean
): T {
  if (isOwner) return character;
  return { ...character, notes: [] };
}
