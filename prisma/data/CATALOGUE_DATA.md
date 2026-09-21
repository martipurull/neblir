# Catalogue Data

This folder contains the canonical catalogue data for official items, enemies, paths, features, maps, and reference entries available to all players, game masters, and campaigns set in Neblir.

The files here are the **source of truth in git**. The live database is updated immediately when a super admin creates or edits catalogue rows in the app; those changes are **not** written back to this folder automatically. A developer must copy exported JSON into the matching `*_Upload.json` files and commit, then the super admin can clear the in-app drift reminder.

Official catalogue **images** live in the shared R2 bucket `neblir-catalogue`. Seed JSON stores `imageKey` only (for example `items-siike_gun.png`, `enemies-…`, `maps-neblir.png`, `vehicles-…`). Developers do **not** copy those objects between the per-environment buckets (`neblir` / `neblir-prod`). Game-scoped and player-scoped images stay on the env bucket.

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
  Dev->>App: Export seed files (per-domain arrays or all-domains zip)
  Dev->>Git: Update *_Upload.json files
  Dev->>Git: Commit and merge
  Dev->>SA: Repo seeds are updated
  SA->>App: "I have updated the repo seeds"
  App->>App: Clear drift reminder
```

### 1. Super admin edits catalogue in the app

Official catalogue is managed under **Super admin** → browse or create flows for:

- Items
- Vehicles
- Paths
- Features
- Enemies
- Reference entries (global rows only — no `gameId`)
- Maps (global rows only — no `gameId`)

Each successful **create, update, or delete** on those official endpoints sets a drift record (`needsSeedRepoUpdate: true`) and appends the affected **domain** (`items`, `vehicles`, `enemies`, `paths`, `features`, `maps`, or `reference`).

On the super admin hub, a warning banner appears: **Update seed data in git**, listing the touched domains and when the last change was recorded.

### 2. Developer exports current database rows

Use one of these (super-admin access required):

**Bulk export (usual choice)**

1. Open `/home/super-admin`.
2. Under **Bulk export for seed files**:
   - One **Download {seed filename}** button per catalogue domain (for example **Download Item_Upload.json**). Enabled only while that domain is listed on the drift banner; all of these buttons are disabled when nothing is touched. Each file is a JSON **array of all current Official rows** in that domain, ready to replace the matching git seed file.
   - **Download all domains** — a **zip** whose entries are `Item_Upload.json`, `Vehicle_Upload.json`, `Enemy_Upload.json`, `Path_Upload.json`, `Feature_Upload.json`, `Map_Upload.json`, and `Reference_Upload.json` (full snapshot of every official domain).
3. Drop the array file(s) or unzip over `prisma/data`. Do **not** treat a download as acknowledging drift: the banner stays until the super admin clicks **I have updated the repo seeds** after git is updated.

**REST alternative:** `GET /api/staff/catalogue-seed-export?scope=touched` or `?scope=all`. Optional `&domains=items,reference` for a subset.

- Default `format` (omit it, or `format=envelope`) returns the envelope `{ exportedAt, scope, domains, data }`.
- `format=array` requires exactly one domain and returns that domain’s JSON array with `Content-Disposition` using the git seed filename.
- `format=zip` returns a zip of those arrays with the same filenames.

Downloading via the hub or this endpoint does **not** acknowledge drift.

**Single-record export (small changes)**

After creating a row, the confirmation page offers **Download JSON for this record**. That file is one object (not an array). Merge it into the matching `*_Upload.json` array by `id` (or by `name` for paths if no `id` is present).

Exports omit import-only fields such as `protectedFromOfficialImport`.

### 3. Developer updates files in `prisma/data`

Map export domains to seed files:

| Drift / export domain | Seed file               | JSON root shape                                |
| --------------------- | ----------------------- | ---------------------------------------------- |
| `items`               | `Item_Upload.json`      | Array of item objects                          |
| `vehicles`            | `Vehicle_Upload.json`   | Array of vehicle objects                       |
| `enemies`             | `Enemy_Upload.json`     | Array of enemy objects                         |
| `paths`               | `Path_Upload.json`      | Array of path objects                          |
| `features`            | `Feature_Upload.json`   | Array of feature objects                       |
| `maps`                | `Map_Upload.json`       | Array of map objects (global only)             |
| `reference`           | `Reference_Upload.json` | Array of reference entry objects (global only) |

**Recommended approach for bulk export:** use the hub’s per-domain array download (or unzip **Download all domains**) as the full contents of the matching file. That keeps git aligned with the database for that domain. The envelope REST payload still exposes the same arrays under `data.<domain>` if you need them.

**Recommended approach for a single new/edited row:** find the row in the target file by `id` (or `name` for paths) and replace it, or append if it is new. Preserve stable `id` values so imports and in-game references stay consistent.

Paths and features are imported together by `upsertPathsAndFeaturesFromFile.ts` but are stored in **separate** files in this folder (`Path_Upload.json` and `Feature_Upload.json`). A zip export includes both files.

### 4. Developer verifies (optional)

Point `OFFICIAL_DATA_*_FILE` env vars at these JSON paths (see `ENV_README.md`), then:

```bash
npm run data:seed:official:dry-run
```

Dry-run parses and reports row counts without writing. Run `npm run data:seed:official` only when intentionally re-importing into a database (e.g. fresh environment), not as part of the normal “sync git from prod/dev DB” loop.

### 5. Developer commits

Commit the updated `*_Upload.json` files. New official `imageKey` objects belong in the catalogue R2 bucket, not in git and not in the env buckets.

### 6. Super admin acknowledges sync

After the developer confirms the repo is updated and merged:

1. Open `/home/super-admin`.
2. Click **I have updated the repo seeds**.

That clears the drift banner until the next official catalogue write. It does **not** modify the database or these files — it only records that git and the live DB are expected to match again.

---

## Catalogue sync (dest-pull overlay)

Git seed files remain the versioned source of truth. Catalogue sync does **not** replace this loop. It copies live Official rows from a source Catalogue environment onto a destination Catalogue environment so Super Admins do not wait on a developer seed import to get Official templates onto dest.

On **Super admin**, open **Catalogue sync**. Choose source and destination Catalogue environments (source defaults to this process; destination starts unselected). Preview and apply run only when this process **is** the destination: dest pulls the source Official snapshot over HTTP with a server-only secret. If dest is another environment, the modal does not load Official row payloads; apply is off and it links to dest’s super-admin with the pairing.

Cookie **Bulk export for seed files** / `GET /api/staff/catalogue-seed-export` stays the human git export door. Catalogue sync uses a separate snapshot door with the same Official payload shape (`scope=all` for all seven catalogue domains). It does not copy games, Characters, Custom or Unique content, currencies, or Official image bytes (images already live in the shared catalogue bucket).

On dest, **Apply** overlays unblocked adds and updates for all seven catalogue domains (source wins, and new rows keep the source id). Blocked Official-name or published-reference slug collisions are skipped. Dest-only Official rows stay unless **Delete unused dest-only Official rows** is checked. That checkbox is off by default. With it on, unused dest-only Official rows are deleted; rows still used in play (holdings, Unique rows from that template, Enemy instances, and the same usage Official delete already lists) are skipped, not deleted. Clean those up on dest’s existing Official delete flow. Confirm states how many rows will apply, how many unused dest-only rows will be deleted, how many in-use dest-only rows will be skipped, and how many other blocked rows will be skipped. Production asks you to type the destination name, including when dest-only delete is on; development and local use a light confirm. An empty overlay (nothing to add, update, or delete) does not write.

Apply sets `protectedFromOfficialImport` on written rows and raises the usual **Update seed data in git** banner for catalogue domains that actually changed. It does not clear that banner, and it does not change the source Catalogue environment. The result lists applied, skipped, and failed rows. A later failure does not undo earlier rows. **Diff again** on the same pairing reloads the Official diff from live dest against a fresh source pull: applied ids drop out; rows that failed and still differ show as pending work.

Then export the touched domains into this folder and commit as usual, and acknowledge. Matching another Catalogue environment is not the same as matching git.

---

## How seed files are consumed

`npm run data:seed:official` runs `prisma/scripts/seedOfficialDataFromFiles.ts`, which imports from the paths set in `OFFICIAL_DATA_*_FILE` (or legacy `*_CSV`) env vars:

| Step             | Script                              | Typical file                               |
| ---------------- | ----------------------------------- | ------------------------------------------ |
| Items            | `upsertItemsFromFile.ts`            | `Item_Upload.json`                         |
| Vehicles         | `upsertVehiclesFromFile.ts`         | `Vehicle_Upload.json`                      |
| Paths & features | `upsertPathsAndFeaturesFromFile.ts` | `Feature_Upload.json` + `Path_Upload.json` |
| Enemies          | `upsertEnemiesFromFile.ts`          | `Enemy_Upload.json`                        |
| Maps             | `upsertMapsFromFile.ts`             | `Map_Upload.json`                          |
| Reference        | `upsertReferenceEntriesFromFile.ts` | `Reference_Upload.json`                    |

Per-domain import scripts are also available via `npm run data:import:items`, `data:import:enemies`, etc.

Rows edited only in the app carry `protectedFromOfficialImport` in the database so a blind re-import from older git data does not overwrite them. Once git is updated from a fresh export, imports and the DB should agree.

---

## Quick checklist (developer)

1. Super admin reports catalogue changes (or drift banner is visible).
2. Export touched catalogue domains (or **Download all domains**) from the super admin hub, or merge single-record JSON. A download does not acknowledge drift.
3. Update the matching `*_Upload.json` file(s) under `prisma/data/`.
4. Commit and merge.
5. Tell the super admin to click **I have updated the repo seeds**.
