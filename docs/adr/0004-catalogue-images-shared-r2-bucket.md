# Official images live in a shared catalogue bucket; everything else stays per-env

Official art must resolve in every environment from the same keys, without copying objects between env buckets or putting binaries in git. We read (and super-admin write/delete) official image keys from a shared Cloudflare R2 bucket (`neblir-catalogue`). Game-scoped and player-scoped uploads stay on the per-environment bucket (`neblir` / `neblir-prod`). The key chooses the bucket by prefix (`items-`, `vehicles-`, `maps-`, `enemies-`, `currencies-`); there is no bucket flag on the row. Missing catalogue credentials fail only catalogue operations; missing env credentials fail only env operations; we do not fall back across buckets. Super-admin may Put/Delete catalogue objects from any environment that has catalogue credentials; catalogue Delete is super-admin-only.

## Considered Options

- **Copy official objects into every env bucket:** keeps one client, but preview/local/prod drift and every new official image is a manual copy.
- **Store official art in git:** versions with seed JSON, but binaries do not belong in this repo.
- **Replicate env buckets with Workers or events:** automatic, but out of scope and still treats official art as env data.
- **Dual-write official images into env and catalogue:** deploy-safe, then leftover env copies forever; we write catalogue only.
- **A bucket field (or catalogue flag) on each row:** explicit, but every reader must load the row, and seed JSON would have to carry it; prefixes already encode official vs not (`custom_items-` is not `items-`).
