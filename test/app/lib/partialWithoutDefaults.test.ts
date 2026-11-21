import { describe, expect, it } from "vitest";
import { combatInformationUpdateRequestSchema } from "@/app/api/characters/[id]/combat-info/schema";
import { healthUpdateSchema } from "@/app/api/characters/[id]/health/schema";
import {
  customEnemyUpdateSchema,
  enemyCatalogueUpdateSchema,
  enemyCreateSchema,
} from "@/app/lib/types/enemy";
import {
  customItemCreateSchema,
  customItemUpdateSchema,
  itemSchema,
  itemUpdateSchema,
} from "@/app/lib/types/item";
import { referenceEntryUpdateSchema } from "@/app/lib/types/reference";
import {
  customVehicleCreateSchema,
  customVehicleUpdateSchema,
} from "@/app/lib/types/vehicle";

const weld = {
  name: "Weld",
  description: null,
  notes: null,
  numberOfDice: 0,
  attribute: "processingPower",
  damage: null,
};

describe("partial update schemas", () => {
  it("keeps an item bot-action patch from writing equip defaults", () => {
    expect(itemUpdateSchema.parse({ botActions: [weld] })).toEqual({
      botActions: [weld],
    });
    expect(itemUpdateSchema.parse({ equippable: false })).toEqual({
      equippable: false,
    });
  });

  it("keeps a custom item name patch from resetting type and attack rolls", () => {
    expect(customItemUpdateSchema.parse({ name: "Rope" })).toEqual({
      name: "Rope",
    });
    expect(
      customItemUpdateSchema.parse({ type: "GENERAL_ITEM", attackRoll: [] })
    ).toEqual({ type: "GENERAL_ITEM", attackRoll: [] });
  });

  it("keeps an enemy name patch from clearing actions", () => {
    expect(enemyCatalogueUpdateSchema.parse({ name: "Goblin" })).toEqual({
      name: "Goblin",
    });
    expect(customEnemyUpdateSchema.parse({ actions: [] })).toEqual({
      actions: [],
    });
  });

  it("keeps a custom vehicle name patch from clearing member edits", () => {
    expect(customVehicleUpdateSchema.parse({ name: "Skiff" })).toEqual({
      name: "Skiff",
    });
    expect(
      customVehicleUpdateSchema.parse({ membersCanModify: false })
    ).toEqual({ membersCanModify: false });
  });

  it("keeps a reference title patch from resetting access, tags, and order", () => {
    expect(referenceEntryUpdateSchema.parse({ title: "Hello" })).toEqual({
      title: "Hello",
    });
    expect(
      referenceEntryUpdateSchema.parse({
        access: "PLAYER",
        tags: [],
        sortOrder: 0,
      })
    ).toEqual({ access: "PLAYER", tags: [], sortOrder: 0 });
  });

  it("keeps a health patch from resetting injuries and status", () => {
    expect(healthUpdateSchema.parse({ currentPhysicalHealth: 5 })).toEqual({
      currentPhysicalHealth: 5,
    });
    expect(healthUpdateSchema.parse({ status: "ALIVE" })).toEqual({
      status: "ALIVE",
    });
  });

  it("keeps a reaction patch from zeroing armour", () => {
    expect(
      combatInformationUpdateRequestSchema.parse({ reactionsRemaining: 1 })
    ).toEqual({ reactionsRemaining: 1 });
    expect(
      combatInformationUpdateRequestSchema.parse({ armourMod: 0 })
    ).toEqual({ armourMod: 0 });
  });

  it("still applies defaults when creating a record", () => {
    expect(
      itemSchema.parse({
        type: "GENERAL_ITEM",
        accessType: "PLAYER",
        name: "Rope",
        confCost: 1,
        description: "A rope",
        weight: 1,
        usage: "hold",
      })
    ).toMatchObject({
      equippable: false,
      equipSlotTypes: [],
      vehicleMountable: false,
      botInstallable: false,
    });

    expect(
      enemyCreateSchema.parse({
        name: "Goblin",
        health: 10,
        speed: 5,
        initiativeModifier: 1,
        numberOfReactions: 1,
      })
    ).toMatchObject({
      actions: [],
      immunities: [],
    });

    expect(
      customItemCreateSchema.parse({
        gameId: "game-1",
        name: "Rope",
        weight: 1,
      })
    ).toMatchObject({
      type: "GENERAL_ITEM",
      attackRoll: [],
    });

    expect(
      customVehicleCreateSchema.parse({
        gameId: "game-1",
        name: "Skiff",
        maxHp: 10,
        travelSpeedKmh: 20,
        combatSpeedMetres: 8,
        manoeuvrability: 1,
        acceleration: 1,
        maxPassengers: 2,
        locomotionModes: ["LAND"],
        vehicleSizeCategory: "STANDARD",
      })
    ).toMatchObject({ membersCanModify: false });
  });
});
