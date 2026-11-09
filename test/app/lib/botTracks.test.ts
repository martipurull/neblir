import { describe, expect, it } from "vitest";
import { BOT_TEMPLATE_TRACK_FIELDS } from "@/app/lib/botTracks";

describe("bot form track labels", () => {
  it("names each upgrade potential on the shared Official, Custom, and Unique fields", () => {
    const labels = Object.fromEntries(
      BOT_TEMPLATE_TRACK_FIELDS.map((field) => [field.key, field.label])
    );

    expect(labels).toMatchObject({
      processingPowerMaxPotential: "Processing Power upgrade potential",
      physicalPowerMaxPotential: "Physical Power upgrade potential",
      finesseCapacityMaxPotential: "Finesse Capacity upgrade potential",
      gridProtectionMaxPotential: "Grid Protection upgrade potential",
      batteryMaxPotential: "Battery upgrade potential",
    });
  });
});
