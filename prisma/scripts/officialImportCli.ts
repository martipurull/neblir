/**
 * Shared CLI flags for official catalogue import scripts.
 */
export function parseOfficialImportArgv(argv: string[]): {
  dryRun: boolean;
  forceOfficialImport: boolean;
  positional: string[];
} {
  const filtered = argv.filter((v) => v !== "--");
  return {
    dryRun: filtered.includes("--dry-run"),
    forceOfficialImport: filtered.includes("--force-official-import"),
    positional: filtered.filter((v) => !v.startsWith("--")),
  };
}
