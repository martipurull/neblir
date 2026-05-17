"use client";

import Link from "next/link";

export type SuperAdminCatalogueDomain =
  | "items"
  | "paths"
  | "features"
  | "enemies"
  | "reference"
  | "maps";

const DOMAIN_BASE: Record<SuperAdminCatalogueDomain, string> = {
  items: "/home/super-admin/items",
  paths: "/home/super-admin/paths",
  features: "/home/super-admin/features",
  enemies: "/home/super-admin/enemies",
  reference: "/home/super-admin/reference",
  maps: "/home/super-admin/maps",
};

type SuperAdminCatalogueDomainNavProps = {
  domain: SuperAdminCatalogueDomain;
  active: "create" | "browse";
};

const tabClass = (active: boolean) =>
  `rounded-lg border-2 border-black px-4 py-2 text-sm font-semibold transition-colors duration-200 ease-in-out ${
    active
      ? "bg-paleBlue text-black"
      : "bg-transparent text-black hover:bg-paleBlue/30"
  }`;

export default function SuperAdminCatalogueDomainNav({
  domain,
  active,
}: SuperAdminCatalogueDomainNavProps) {
  const base = DOMAIN_BASE[domain];
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="Catalogue section">
      <Link href={base} className={tabClass(active === "create")}>
        Create
      </Link>
      <Link href={`${base}/browse`} className={tabClass(active === "browse")}>
        Browse
      </Link>
    </nav>
  );
}
