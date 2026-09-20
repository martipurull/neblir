# Official names are unique within a catalogue domain

Seed import already upserts Official items and vehicles by name, but the database only unique-enforced enemies, maps, and paths. We treat **Official name** as identity within a catalogue domain: create, rename, and promotion reject a name that matches an existing row after trim, case-fold, and collapsing internal whitespace. A `PLAYER` row and a `GAME_MASTER` row cannot share an Official name. Published reference entries keep slug identity. Custom templates may reuse an Official name until promotion.

## Considered Options

- **Unique on `(name, accessType)`:** keeps a player kit and a GM-only clone under the same name, but seed import-by-name would update one row and leave the other as a ghost.
- **Exact Prisma `@unique` only:** `"Siike Gun"` and `"siike gun"` would both exist; staff will type casing differently.
- **Merge live duplicates automatically:** rewires holdings by id; too much blast radius given git seeds are already unique.

## Consequences

- Schema `@unique([name])` is an exact backstop; case and whitespace matching is app-enforced.
- If a unique index fails on live data, stop and rename by hand — do not merge.
- Inventory and combat keep pointing at ids; renaming a row does not break holdings. Deleting the id still in use does.
