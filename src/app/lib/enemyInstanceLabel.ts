import {
  resolvedInstanceNumber,
  trailingInstanceNumber,
} from "@/app/lib/enemyInstanceNumber";

export type EnemyInstanceLabelFields = {
  name: string;
  sourceName?: string | null;
  instanceNumber?: number | null;
  renamed?: boolean | null;
  numberVisible?: boolean | null;
  isPublic?: boolean | null;
};

function instanceNameWithoutNumber(name: string): string {
  return name.replace(trailingInstanceNumber, "");
}

function instanceNumberIsVisible(instance: EnemyInstanceLabelFields): boolean {
  if (instance.numberVisible) return true;
  if (resolvedInstanceNumber(instance) > 1) return true;
  return trailingInstanceNumber.test(instance.name);
}

export function composeEnemyInstanceLabel(
  instance: EnemyInstanceLabelFields,
  options?: { viewerIsGameMaster?: boolean }
): string {
  const viewerIsGameMaster = options?.viewerIsGameMaster ?? true;
  if (!viewerIsGameMaster && instance.isPublic === false) {
    return "Enemy";
  }

  const instanceNumber = resolvedInstanceNumber(instance);
  const instanceName = instance.renamed
    ? instance.name
    : instanceNameWithoutNumber(instance.name);
  const sourceName =
    instance.sourceName ?? instanceNameWithoutNumber(instance.name);

  if (instance.renamed) {
    return `${instanceName} (${sourceName} #${instanceNumber})`;
  }
  if (instanceNumberIsVisible(instance)) {
    return `${instanceName} #${instanceNumber}`;
  }
  return instanceName;
}

export function withInstanceLabel<T extends EnemyInstanceLabelFields>(
  instance: T,
  options?: { viewerIsGameMaster?: boolean }
): T & { instanceLabel: string } {
  return {
    ...instance,
    instanceLabel: composeEnemyInstanceLabel(instance, options),
  };
}

export function withInstanceLabels<T extends EnemyInstanceLabelFields>(
  instances: T[],
  viewerIsGameMaster = true
): Array<T & { instanceLabel: string }> {
  return instances.map((instance) =>
    withInstanceLabel(instance, { viewerIsGameMaster })
  );
}

export function instanceLabelOf(instance: {
  name: string;
  instanceLabel?: string;
}): string {
  return instance.instanceLabel ?? instance.name;
}
