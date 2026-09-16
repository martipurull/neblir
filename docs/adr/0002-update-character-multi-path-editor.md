# Update Character edits the full path set under rank and feature invariants

Update Character used a single **primary path** picker that could replace one `PathCharacter` row and wipe features tied only to other paths, even though the sheet already lists multiple paths. We rebuild that step as a real multi-path editor: add/remove paths (no in-place path swap), edit ranks, and edit the flat owned-feature list. On save, path ranks must sum to level (**unallocated level** 0), at least one path exists with each rank ≥ 1, owned feature **grades** fit `2 × (level − 1)`, and every owned feature is **legal** for at least one current path+rank. PATCH fully replaces `paths[]` and owned features; favourite weapon is kept when Soldier remains and cleared when Soldier is removed. Illegal or over-budget state blocks save with clear UI reasons (no silent trim on rank/level edits); removing a path still cascades features that are no longer legal. Create and Level-up stay on their existing flows; Level-up already preserves the sum invariant when it held.

## Considered Options

- **Keep primary-path Update:** smallest change, but the privileged row and feature replace keep multiclass footguns.
- **Soft ranks (no `sum(ranks) == level`):** matches today’s unenforced DB, but level and path progress drift and fight Level-up’s +1 level / +1 rank fiction.
- **Per-path feature budgets / path-owned features in the UI:** clearer “under Soldier” editing, but storage has no feature↔path id and shared catalogue features belong to more than one path.
- **Auto-trim ranks or illegal features when level/rank drops:** fewer blocked saves, but contradicts Update’s existing “lower level → fix allocations yourself” pattern; path **remove** is the exception that cascades.
- **Diff/patch path ops instead of full replace:** finer wire format, harder to validate the whole invariant set in one shot.
- **Rebuild Level-up in the same branch:** would align UX, but Level-up already adds a path or bumps one rank with two feature upgrades; revisit only if Update’s checks prove a contradiction.
