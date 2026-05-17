import { describe, expect, it } from "vitest";
import { resolveCatalogueExportDomains } from "@/app/lib/catalogueExportResolve";

describe("resolveCatalogueExportDomains", () => {
  it("returns explicit domains when domainsParam is set", () => {
    const { domains, error } = resolveCatalogueExportDomains({
      scope: "touched",
      domainsParam: "items,maps",
      touchedDomains: [],
    });
    expect(error).toBeUndefined();
    expect(domains).toEqual(["items", "maps"]);
  });

  it("returns error for unknown domain", () => {
    const { domains, error } = resolveCatalogueExportDomains({
      scope: "all",
      domainsParam: "items,unknown",
      touchedDomains: [],
    });
    expect(domains).toEqual([]);
    expect(error).toContain("unknown");
  });

  it("returns all domains when scope is all and no domains param", () => {
    const { domains, error } = resolveCatalogueExportDomains({
      scope: "all",
      domainsParam: null,
      touchedDomains: [],
    });
    expect(error).toBeUndefined();
    expect(domains).toContain("items");
    expect(domains).toContain("reference");
    expect(domains.length).toBe(6);
  });

  it("filters touched domains to known set", () => {
    const { domains, error } = resolveCatalogueExportDomains({
      scope: "touched",
      domainsParam: null,
      touchedDomains: ["items", "nope", "maps"],
    });
    expect(error).toBeUndefined();
    expect(domains).toEqual(["items", "maps"]);
  });
});
