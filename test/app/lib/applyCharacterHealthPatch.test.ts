import { describe, expect, it } from "vitest";
import { applyCharacterHealthPatch } from "@/app/lib/applyCharacterHealthPatch";
import type { CharacterHealthSnapshot } from "@/app/lib/applyCharacterHealthPatch";

function health(
  overrides: Partial<CharacterHealthSnapshot> = {}
): CharacterHealthSnapshot {
  return {
    currentPhysicalHealth: 8,
    currentMentalHealth: 8,
    maxPhysicalHealth: 10,
    maxMentalHealth: 10,
    seriousPhysicalInjuries: 0,
    seriousTrauma: 0,
    deathSaves: { successes: 0, failures: 0 },
    madnessSaves: { successes: 0, failures: 0 },
    status: "ALIVE",
    ...overrides,
  };
}

describe("applyCharacterHealthPatch", () => {
  it("sets status from the patch without rewriting death-roll boxes", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 1, failures: 2 },
      }),
      { status: "DECEASED" }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.status).toBe("DECEASED");
    expect(result.health.deathSaves).toEqual({ successes: 1, failures: 2 });
  });

  it("does not auto-revive when death-roll failures drop below 3", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        status: "DECEASED",
        deathSaves: { successes: 0, failures: 3 },
      }),
      { deathSaves: { successes: 0, failures: 2 } }
    );
    expect(result.ok).toBe(false);
  });

  it("clears the death-roll track when physical HP rises above 0", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 2, failures: 1 },
      }),
      { currentPhysicalHealth: 1 }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.deathSaves).toEqual({ successes: 0, failures: 0 });
    expect(result.health.status).toBe("ALIVE");
  });

  it("marks a death-roll failure for a hit while in-cycle at 0 physical HP", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 1, failures: 1 },
      }),
      { physicalHitsAtZero: 1 }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.deathSaves.failures).toBe(2);
    expect(result.health.currentPhysicalHealth).toBe(0);
  });

  it("does not mark a failure for a hit while stable", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        deathSaves: { successes: 3, failures: 1 },
      }),
      { physicalHitsAtZero: 1 }
    );
    expect(result.ok).toBe(false);
  });

  it("sets DECEASED when death-roll failures reach 3", () => {
    const result = applyCharacterHealthPatch(
      health({ currentPhysicalHealth: 0 }),
      { deathSaves: { successes: 1, failures: 3 } }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.status).toBe("DECEASED");
  });

  it("sets DECEASED when serious physical injuries reach 3", () => {
    const result = applyCharacterHealthPatch(health(), {
      seriousPhysicalInjuries: 3,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.status).toBe("DECEASED");
  });

  it("clears the madness-roll track when mental HP rises above 0", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentMentalHealth: 0,
        madnessSaves: { successes: 2, failures: 1 },
      }),
      { currentMentalHealth: 1 }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.madnessSaves).toEqual({ successes: 0, failures: 0 });
  });

  it("marks a madness-roll failure for a hit while in-cycle at 0 mental HP", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentMentalHealth: 0,
        madnessSaves: { successes: 1, failures: 1 },
      }),
      { mentalHitsAtZero: 1 }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.madnessSaves?.failures).toBe(2);
    expect(result.health.currentMentalHealth).toBe(0);
  });

  it("allows death-roll box edits while deranged", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        currentMentalHealth: 0,
        status: "DERANGED",
        madnessSaves: { successes: 0, failures: 3 },
      }),
      { deathSaves: { successes: 1, failures: 0 } }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.status).toBe("DERANGED");
    expect(result.health.deathSaves).toEqual({ successes: 1, failures: 0 });
  });

  it("keeps ALIVE when only status is patched while failures are already 3", () => {
    const result = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        status: "DECEASED",
        deathSaves: { successes: 0, failures: 3 },
      }),
      { status: "ALIVE" }
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.health.status).toBe("ALIVE");
    expect(result.health.deathSaves.failures).toBe(3);
  });

  it("sets DERANGED on three madness failures unless already DECEASED", () => {
    const deranged = applyCharacterHealthPatch(
      health({ currentMentalHealth: 0 }),
      { madnessSaves: { successes: 0, failures: 3 } }
    );
    expect(deranged.ok).toBe(true);
    if (deranged.ok) expect(deranged.health.status).toBe("DERANGED");

    const deceased = applyCharacterHealthPatch(
      health({
        currentPhysicalHealth: 0,
        currentMentalHealth: 0,
        status: "DECEASED",
        deathSaves: { successes: 0, failures: 3 },
      }),
      { madnessSaves: { successes: 0, failures: 3 } }
    );
    expect(deceased.ok).toBe(false);
  });
});
