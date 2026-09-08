type EnemyInstanceSpawnAllocation = {
  instanceNumber: number;
  name: string;
  sourceName: string;
  renamed: false;
};

type OccupiedEnemyInstance = {
  instanceNumber?: number | null;
  name: string;
};

const trailingInstanceNumber = / #(\d+)$/;

function occupiedInstanceNumber(instance: OccupiedEnemyInstance): number {
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
      : Math.max(...occupied.map(occupiedInstanceNumber));
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
  return nextInstanceNumbers(occupied, count).map((instanceNumber) => ({
    instanceNumber,
    name: instanceName,
    sourceName,
    renamed: false as const,
  }));
}
