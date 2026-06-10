# Catalogue Data

This folder contains the canonical catalogue data for official items, enemies, paths, features, maps, and reference entries available to all players, game masters, and campaigns set in Neblir.

The files here are the **source of truth in git**. The live database is updated immediately when a super admin creates or edits catalogue rows in the app; those changes are **not** written back to this folder automatically. A developer must copy exported JSON into the matching `*_Upload.json` files and commit, then the super admin can clear the in-app drift reminder.

---

## Roles

| Role            | Responsibility                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Super admin** | Create or edit official catalogue content via **Super admin** (`/home/super-admin`). Changes persist to the database straight away. |
| **Developer**   | Export the current DB rows, update the JSON files in this folder, commit, and tell the super admin when the repo is in sync.        |

---

## End-to-end workflow

```mermaid
sequenceDiagram
  participant SA as Super admin
  participant App as Neblir app / DB
  participant Dev as Developer
  participant Git as prisma/data (git)

  SA->>App: Create or edit official catalogue row
  App->>App: Save to database; set drift flag
  SA->>Dev: Notify (or dev sees drift banner)
  Dev->>App: Export JSON (touched domains or single record)
  Dev->>Git: Update *_Upload.json files
  Dev->>Git: Commit and merge
  Dev->>SA: Repo seeds are updated
  SA->>App: "I have updated the repo seeds"
  App->>App: Clear drift reminder
```

### 1. Super admin edits catalogue in the app

Official catalogue is managed under **Super admin** → browse or create flows for:

- Items
- Paths
- Features
- Enemies
- Reference entries (global rows only — no `gameId`)
- Maps (global rows only — no `gameId`)

Each successful **create, update, or delete** on those official endpoints sets a drift record (`needsSeedRepoUpdate: true`) and appends the affected **domain** (`items`, `enemies`, `paths`, `features`, `maps`, or `reference`).

On the super admin hub, a warning banner appears: **Update seed data in git**, listing the touched domains and when the last change was recorded.

### 2. Developer exports current database rows

Use one of these (super-admin access required):

**Bulk export (usual choice)**

1. Open `/home/super-admin`.
2. Under **Bulk export for seed files**:
   - **Download touched domains** — exports only domains listed on the drift banner (disabled after acknowledge until the next write).
   - **Download all domains** — full snapshot of every official domain (use when refreshing everything).
3. The download is a single JSON file shaped like:
   ```json
   {
     "exportedAt": "...",
     "scope": "touched",
     "domains": ["items"],
     "data": {
       "items": [
         /* ... */
       ]
     }
   }
   ```

**REST alternative:** `GET /api/staff/catalogue-seed-export?scope=touched` or `?scope=all`. Optional `&domains=items,reference` for a subset.

**Single-record export (small changes)**

After creating a row, the confirmation page offers **Download JSON for this record**. That file is one object (not an array). Merge it into the matching `*_Upload.json` array by `id` (or by `name` for paths if no `id` is present).

Exports omit import-only fields such as `protectedFromOfficialImport`.

### 3. Developer updates files in `prisma/data`

Map export domains to seed files:

| Drift / export domain | Seed file               | JSON root shape                                |
| --------------------- | ----------------------- | ---------------------------------------------- |
| `items`               | `Item_Upload.json`      | Array of item objects                          |
| `enemies`             | `Enemy_Upload.json`     | Array of enemy objects                         |
| `paths`               | `Path_Upload.json`      | Array of path objects                          |
| `features`            | `Feature_Upload.json`   | Array of feature objects                       |
| `maps`                | `Map_Upload.json`       | Array of map objects (global only)             |
| `reference`           | `Reference_Upload.json` | Array of reference entry objects (global only) |

**Recommended approach for bulk export:** take `data.<domain>` from the export and use it as the full contents of the matching file (pretty-printed array). That keeps git aligned with the database for that domain.

**Recommended approach for a single new/edited row:** find the row in the target file by `id` (or `name` for paths) and replace it, or append if it is new. Preserve stable `id` values so imports and in-game references stay consistent.

Paths and features are imported together by `upsertPathsAndFeaturesFromFile.ts` but are stored in **separate** files in this folder (`Path_Upload.json` and `Feature_Upload.json`). A bundle export still provides `data.paths` and `data.features` as separate arrays.

### 4. Developer verifies (optional)

Point `OFFICIAL_DATA_*_FILE` env vars at these JSON paths (see `ENV_README.md`), then:

```bash
npm run data:seed:official:dry-run
```

Dry-run parses and reports row counts without writing. Run `npm run data:seed:official` only when intentionally re-importing into a database (e.g. fresh environment), not as part of the normal “sync git from prod/dev DB” loop.

### 5. Developer commits

Commit the updated `*_Upload.json` files (and any related assets, e.g. new `imageKey` files in R2, if applicable).

### 6. Super admin acknowledges sync

After the developer confirms the repo is updated and merged:

1. Open `/home/super-admin`.
2. Click **I have updated the repo seeds**.

That clears the drift banner until the next official catalogue write. It does **not** modify the database or these files — it only records that git and the live DB are expected to match again.

---

## How seed files are consumed

`npm run data:seed:official` runs `prisma/scripts/seedOfficialDataFromFiles.ts`, which imports from the paths set in `OFFICIAL_DATA_*_FILE` (or legacy `*_CSV`) env vars:

| Step             | Script                              | Typical file                               |
| ---------------- | ----------------------------------- | ------------------------------------------ |
| Items            | `upsertItemsFromFile.ts`            | `Item_Upload.json`                         |
| Paths & features | `upsertPathsAndFeaturesFromFile.ts` | `Feature_Upload.json` + `Path_Upload.json` |
| Enemies          | `upsertEnemiesFromFile.ts`          | `Enemy_Upload.json`                        |
| Maps             | `upsertMapsFromFile.ts`             | `Map_Upload.json`                          |
| Reference        | `upsertReferenceEntriesFromFile.ts` | `Reference_Upload.json`                    |

Per-domain import scripts are also available via `npm run data:import:items`, `data:import:enemies`, etc.

Rows edited only in the app carry `protectedFromOfficialImport` in the database so a blind re-import from older git data does not overwrite them. Once git is updated from a fresh export, imports and the DB should agree.

---

## Quick checklist (developer)

1. Super admin reports catalogue changes (or drift banner is visible).
2. Export **touched domains** (or **all domains**) from super admin hub, or merge single-record JSON.
3. Update the matching `*_Upload.json` file(s) under `prisma/data/`.
4. Commit and merge.
5. Tell the super admin to click **I have updated the repo seeds**.
