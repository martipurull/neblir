import type { Status } from "@prisma/client";

export type CrisisTrack = {
  successes: number;
  failures: number;
};

export type CharacterHealthSnapshot = {
  currentPhysicalHealth: number;
  currentMentalHealth: number;
  maxPhysicalHealth: number;
  maxMentalHealth: number;
  seriousPhysicalInjuries: number;
  seriousTrauma: number;
  deathSaves: CrisisTrack;
  madnessSaves?: CrisisTrack;
  status: Status;
};

export type CharacterHealthPatch = {
  currentPhysicalHealth?: number;
  currentMentalHealth?: number;
  seriousPhysicalInjuries?: number;
  seriousTrauma?: number;
  deathSaves?: CrisisTrack;
  madnessSaves?: CrisisTrack;
  status?: Status;
  physicalHitsAtZero?: number;
  mentalHitsAtZero?: number;
};

export type ApplyHealthResult =
  | { ok: true; health: CharacterHealthSnapshot }
  | { ok: false; error: string };

function clampTrack(track: CrisisTrack): CrisisTrack {
  return {
    successes: Math.max(0, Math.min(3, track.successes)),
    failures: Math.max(0, Math.min(3, track.failures)),
  };
}

function tracksEqual(a: CrisisTrack, b: CrisisTrack): boolean {
  return a.successes === b.successes && a.failures === b.failures;
}

function emptyTrack(): CrisisTrack {
  return { successes: 0, failures: 0 };
}

function isStable(track: CrisisTrack): boolean {
  return track.successes >= 3 && track.failures < 3;
}

function inDeathCycle(health: CharacterHealthSnapshot): boolean {
  return (
    health.currentPhysicalHealth === 0 &&
    health.status !== "DECEASED" &&
    !isStable(health.deathSaves)
  );
}

function inMadnessCycle(health: CharacterHealthSnapshot): boolean {
  const track = health.madnessSaves ?? emptyTrack();
  return (
    health.currentMentalHealth === 0 &&
    health.status === "ALIVE" &&
    !isStable(track)
  );
}

export function applyCharacterHealthPatch(
  existing: CharacterHealthSnapshot,
  patch: CharacterHealthPatch
): ApplyHealthResult {
  const existingDeath = clampTrack(existing.deathSaves);
  const existingMadness = clampTrack(existing.madnessSaves ?? emptyTrack());

  if (
    existing.status === "DECEASED" &&
    patch.deathSaves != null &&
    !tracksEqual(clampTrack(patch.deathSaves), existingDeath)
  ) {
    return {
      ok: false,
      error: "Death-roll boxes cannot be changed while status is deceased.",
    };
  }

  if (
    (existing.status === "DECEASED" || existing.status === "DERANGED") &&
    patch.madnessSaves != null &&
    !tracksEqual(clampTrack(patch.madnessSaves), existingMadness)
  ) {
    return {
      ok: false,
      error:
        "Madness-roll boxes cannot be changed while status is deranged or deceased.",
    };
  }

  let deathSaves = existingDeath;
  let madnessSaves = existingMadness;
  let currentPhysicalHealth = existing.currentPhysicalHealth;
  let currentMentalHealth = existing.currentMentalHealth;
  let seriousPhysicalInjuries = existing.seriousPhysicalInjuries;
  let seriousTrauma = existing.seriousTrauma;
  let status = existing.status;

  if (patch.currentPhysicalHealth != null) {
    currentPhysicalHealth = patch.currentPhysicalHealth;
  }
  if (patch.currentMentalHealth != null) {
    currentMentalHealth = patch.currentMentalHealth;
  }
  if (patch.seriousPhysicalInjuries != null) {
    seriousPhysicalInjuries = patch.seriousPhysicalInjuries;
  }
  if (patch.seriousTrauma != null) {
    seriousTrauma = patch.seriousTrauma;
  }
  if (patch.deathSaves != null) {
    deathSaves = clampTrack(patch.deathSaves);
  }
  if (patch.madnessSaves != null) {
    madnessSaves = clampTrack(patch.madnessSaves);
  }
  if (patch.status != null) {
    status = patch.status;
  }

  if (patch.currentPhysicalHealth != null && currentPhysicalHealth > 0) {
    deathSaves = emptyTrack();
  }
  if (patch.currentMentalHealth != null && currentMentalHealth > 0) {
    madnessSaves = emptyTrack();
  }

  const mergedForHits: CharacterHealthSnapshot = {
    ...existing,
    currentPhysicalHealth,
    currentMentalHealth,
    seriousPhysicalInjuries,
    seriousTrauma,
    deathSaves,
    madnessSaves,
    status,
  };

  const physicalHits = patch.physicalHitsAtZero ?? 0;
  if (physicalHits > 0) {
    if (existing.currentPhysicalHealth !== 0 || currentPhysicalHealth !== 0) {
      return {
        ok: false,
        error: "Physical hits at zero HP only apply while physical HP is 0.",
      };
    }
    if (!inDeathCycle({ ...mergedForHits, deathSaves: existingDeath })) {
      return {
        ok: false,
        error:
          "A hit at 0 physical HP does not mark a death-roll failure while stable or deceased. Reset the death roll first if starting a new cycle.",
      };
    }
    deathSaves = clampTrack({
      ...deathSaves,
      failures: deathSaves.failures + physicalHits,
    });
  }

  const mentalHits = patch.mentalHitsAtZero ?? 0;
  if (mentalHits > 0) {
    if (existing.currentMentalHealth !== 0 || currentMentalHealth !== 0) {
      return {
        ok: false,
        error: "Mental hits at zero HP only apply while mental HP is 0.",
      };
    }
    if (
      !inMadnessCycle({
        ...mergedForHits,
        madnessSaves: existingMadness,
      })
    ) {
      return {
        ok: false,
        error:
          "A hit at 0 mental HP does not mark a madness-roll failure while composed, deranged, or deceased. Reset the madness roll first if starting a new cycle.",
      };
    }
    madnessSaves = clampTrack({
      ...madnessSaves,
      failures: madnessSaves.failures + mentalHits,
    });
  }

  if (patch.seriousPhysicalInjuries != null && seriousPhysicalInjuries >= 3) {
    status = "DECEASED";
  }
  if (
    (patch.deathSaves != null || physicalHits > 0) &&
    deathSaves.failures >= 3
  ) {
    status = "DECEASED";
  }
  if (
    patch.seriousTrauma != null &&
    seriousTrauma >= 3 &&
    status !== "DECEASED"
  ) {
    status = "DERANGED";
  }
  if (
    (patch.madnessSaves != null || mentalHits > 0) &&
    madnessSaves.failures >= 3 &&
    status !== "DECEASED"
  ) {
    status = "DERANGED";
  }

  return {
    ok: true,
    health: {
      ...existing,
      currentPhysicalHealth,
      currentMentalHealth,
      seriousPhysicalInjuries,
      seriousTrauma,
      deathSaves,
      madnessSaves,
      status,
    },
  };
}
