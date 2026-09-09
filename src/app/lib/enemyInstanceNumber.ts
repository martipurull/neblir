type EnemyInstanceSpawnAllocation = {
  instanceNumber: number;
  name: string;
  sourceName: string;
  renamed: false;
  numberVisible: boolean;
};

export type OccupiedEnemyInstance = {
  instanceNumber?: number | null;
  name: string;
};

export const trailingInstanceNumber = / #(\d+)$/;

export function resolvedInstanceNumber(
  instance: OccupiedEnemyInstance
): number {
  if (instance.instanceNumber != null && instance.instanceNumber >= 1) {
    return instance.instanceNumber;
  }
  const match = trailingInstanceNumber.exec(instance.name);
  if (!match) return 1;
  const fromName = Number.parseInt(match[1] ?? "", 10);
  return fromName >= 1 ? fromName : 1;
}

function nextInstanceNumbers(
  occupied: OccupiedEnemyInstance[],
  count: number
): number[] {
  const maxOccupied =
    occupied.length === 0
      ? 0
      : Math.max(...occupied.map(resolvedInstanceNumber));
  return Array.from({ length: count }, (_, i) => maxOccupied + i + 1);
}

export function allocateEnemyInstanceSpawns({
  occupied,
  count,
  sourceName,
  instanceName,
}: {
  occupied: OccupiedEnemyInstance[];
  count: number;
  sourceName: string;
  instanceName: string;
}): EnemyInstanceSpawnAllocation[] {
  const numberVisible = occupied.length > 0 || count > 1;
  return nextInstanceNumbers(occupied, count).map((instanceNumber) => ({
    instanceNumber,
    name: instanceName,
    sourceName,
    renamed: false as const,
    numberVisible,
  }));
}
