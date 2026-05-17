import { describe, expect, it } from "vitest";
import { parseReferenceSeedJson } from "../../prisma/scripts/referenceSeedJsonParse";

describe("parseReferenceSeedJson", () => {
  const sampleRow = {
    category: "MECHANICS",
    slug: "dice-mechanics",
    title: "Dice Mechanics",
    access: "PLAYER",
    tags: [],
    sortOrder: 0,
    contentJson: { type: "doc", content: [] },
    gameId: null,
  };

  it("parses a top-level array", () => {
    const rows = parseReferenceSeedJson(JSON.stringify([sampleRow]));
    expect(rows).toHaveLength(1);
    expect(rows[0].data.slug).toBe("dice-mechanics");
    expect(rows[0].id).toBeUndefined();
  });

  it("parses catalogue export shape with reference key", () => {
    const rows = parseReferenceSeedJson(
      JSON.stringify({ reference: [sampleRow] })
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].data.title).toBe("Dice Mechanics");
  });

  it("strips export-only fields and keeps optional id", () => {
    const rows = parseReferenceSeedJson(
      JSON.stringify([
        {
          ...sampleRow,
          id: "507f1f77bcf86cd799439011",
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
          protectedFromOfficialImport: true,
        },
      ])
    );
    expect(rows[0].id).toBe("507f1f77bcf86cd799439011");
    expect(rows[0].data).not.toHaveProperty("protectedFromOfficialImport");
  });

  it("throws for invalid root", () => {
    expect(() => parseReferenceSeedJson("{}")).toThrow(/reference/i);
  });
});
