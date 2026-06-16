import { describe, expect, it } from "vitest";
import { currentUserSchema, userUpdateSchema } from "@/app/lib/types/user";

describe("userUpdateSchema character preferences", () => {
  it("accepts characterCarouselWrap boolean updates", () => {
    expect(
      userUpdateSchema.safeParse({ characterCarouselWrap: false }).success
    ).toBe(true);
    expect(
      userUpdateSchema.safeParse({ characterCarouselWrap: true }).success
    ).toBe(true);
  });

  it("accepts null characterCarouselWrap to clear preference", () => {
    expect(
      userUpdateSchema.safeParse({ characterCarouselWrap: null }).success
    ).toBe(true);
  });

  it("rejects non-boolean characterCarouselWrap", () => {
    expect(
      userUpdateSchema.safeParse({ characterCarouselWrap: "yes" }).success
    ).toBe(false);
  });

  it("rejects invalid characterLayoutMode", () => {
    expect(
      userUpdateSchema.safeParse({ characterLayoutMode: "diagonal" }).success
    ).toBe(false);
  });

  it("accepts valid characterLayoutMode values", () => {
    expect(
      userUpdateSchema.safeParse({ characterLayoutMode: "horizontal" }).success
    ).toBe(true);
    expect(
      userUpdateSchema.safeParse({ characterLayoutMode: "vertical" }).success
    ).toBe(true);
  });

  it("accepts valid characterSectionOrder updates", () => {
    expect(
      userUpdateSchema.safeParse({
        characterSectionOrder: ["inventory", "attributes"],
      }).success
    ).toBe(true);
  });

  it("accepts null characterSectionOrder to clear preference", () => {
    expect(
      userUpdateSchema.safeParse({ characterSectionOrder: null }).success
    ).toBe(true);
  });

  it("accepts empty characterSectionOrder array", () => {
    expect(
      userUpdateSchema.safeParse({ characterSectionOrder: [] }).success
    ).toBe(true);
  });

  it("rejects duplicate ids in characterSectionOrder", () => {
    expect(
      userUpdateSchema.safeParse({
        characterSectionOrder: ["attributes", "attributes"],
      }).success
    ).toBe(false);
  });

  it("rejects unknown ids in characterSectionOrder", () => {
    expect(
      userUpdateSchema.safeParse({
        characterSectionOrder: ["attributes", "foo"],
      }).success
    ).toBe(false);
  });
});

describe("currentUserSchema character preferences", () => {
  it("accepts null carousel wrap in current user payload", () => {
    const result = currentUserSchema.safeParse({
      id: "user-1",
      name: "Taylor",
      email: "taylor@example.com",
      isSuperAdmin: false,
      characterLayoutMode: null,
      characterCarouselWrap: null,
      characterSectionOrder: null,
    });
    expect(result.success).toBe(true);
  });

  it("accepts saved character section order", () => {
    const result = currentUserSchema.safeParse({
      id: "user-1",
      name: "Taylor",
      email: "taylor@example.com",
      isSuperAdmin: false,
      characterLayoutMode: "horizontal",
      characterCarouselWrap: false,
      characterSectionOrder: ["inventory", "attributes"],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characterSectionOrder).toEqual([
        "inventory",
        "attributes",
      ]);
    }
  });

  it("accepts explicit carousel wrap preference", () => {
    const result = currentUserSchema.safeParse({
      id: "user-1",
      name: "Taylor",
      email: "taylor@example.com",
      isSuperAdmin: false,
      characterLayoutMode: "horizontal",
      characterCarouselWrap: false,
      characterSectionOrder: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characterCarouselWrap).toBe(false);
    }
  });
});
