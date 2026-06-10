# CI, Vercel, and native dependency installs

This document explains cross-platform `npm` install failures that only show up on **Linux** (GitHub Actions, Vercel) while local macOS dev may still work. See also **§12** in [`AGENTS.md`](../AGENTS.md) for agent-facing rules.

## Background

Several dev/build tools ship **platform-specific native binaries** as npm `optionalDependencies`:

| Tool / package | Examples                                                              | Used by                       |
| -------------- | --------------------------------------------------------------------- | ----------------------------- |
| `esbuild`      | `@esbuild/linux-x64`, `@esbuild/darwin-arm64`                         | `vitest`, Vite, Next.js build |
| `oxc-parser`   | `@oxc-parser/binding-linux-x64-gnu`, `@oxc-parser/binding-darwin-x64` | `knip`                        |
| `oxc-resolver` | `@oxc-resolver/binding-linux-x64-gnu`, …                              | `knip`                        |

- **GitHub Actions** and **Vercel** run on **Linux x64**.
- Local development is usually **macOS** (darwin arm64 or x64).
- `npm ci` on Linux requires the lockfile to list every package it will install, including optional platform binaries for that environment.

If the lockfile was generated on a Mac without Linux optional entries, or if platform bindings are declared incorrectly in `package.json`, installs fail on CI/Vercel even when `npm install` succeeds locally.

## Symptom → likely cause

| Error (or log snippet)                                                                               | Likely cause                                                                                             |
| ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `Missing: esbuild@0.28.0 from lock file` / `Missing: @esbuild/linux-x64@…` during `npm ci` on GitHub | Lockfile missing Linux optional entries (often after `npm install` on macOS pruned them).                |
| `EBADPLATFORM` … `@oxc-parser/binding-darwin-x64` … `Actual os: linux` (Vercel or CI)                | A **macOS-only** binding is in `devDependencies` (required on every OS).                                 |
| `Cannot find native binding` / `Cannot find module '@oxc-parser/binding-linux-x64-gnu'` (knip on CI) | Linux optional binding not installed; often npm &lt; 11.3 optional-deps bug or missing lockfile entries. |
| `The package "@esbuild/linux-x64" could not be found` (Vercel build)                                 | Same class of issue: Linux esbuild binary not installed at build time.                                   |
| `husky: not found` during `npm ci` in CI                                                             | `prepare` script ran `husky` before hooks tooling is available (or in a non-git CI checkout).            |
| `Node.js 20 actions are deprecated` (GitHub Actions)                                                 | Workflow uses `actions/checkout@v4` / `setup-node@v4`; upgrade to **v6**.                                |

## Root causes (incident summary, 2026)

We hit a stack of issues at once:

1. **Lockfile / platform mismatch** — Vitest 4 pulls in `esbuild` with per-platform optional packages. A lockfile updated only on macOS could lack `@esbuild/linux-x64` entries, so `npm ci` failed on `ubuntu-latest`.

2. **Bad fix: `.npmrc` with `os=linux,darwin` and `cpu=arm64,x64`** — Intended to keep Linux entries in the lockfile, but it **broke optional dependency installation** on all platforms. Do not use this approach.

3. **Wrong dependency type** — Putting `@oxc-parser/binding-darwin-x64` in `devDependencies` made npm **require** it on Linux → Vercel `EBADPLATFORM`.

4. **Node / npm versions** — `knip` / `oxc-parser` expect **Node ≥ 22.12**. npm had a [known optional-dependencies bug](https://github.com/npm/cli/issues/4828) fixed in **npm ≥ 11.3**.

5. **Husky in CI** — Unconditional `prepare: husky` failed in GitHub Actions.

## Current repo setup (the fix)

### `package.json`

- **`engines`**: `node >= 22.12.0`, `npm >= 11.3.0`
- **`optionalDependencies`**: explicit Darwin **and** Linux bindings for `esbuild`, `oxc-parser`, and `oxc-resolver` (pinned versions). npm installs only packages matching the current OS/CPU; others are skipped.
- **`prepare`**: skips Husky when `CI` or `VERCEL` is set; uses `npx husky` locally.
- **Do not** put `@esbuild/*` or `@oxc-parser/binding-*` in `devDependencies`.

### `.node-version`

Pinned to **22.12** (used by GitHub Actions `setup-node`).

### `.github/workflows/quality-checks.yml`

- `actions/checkout@v6`, `actions/setup-node@v6` (Node 24–compatible action runtime).
- `HUSKY=0` in job env.
- `npm install -g npm@11.6.4` before `npm ci`.
- `node-version-file: .node-version`.

### What we removed

- **`.npmrc`** with `os=` / `cpu=` — do not reintroduce.

## After changing dependencies on a Mac

1. Use **Node 22.12+** (`nvm use` / read `.node-version`).
2. Run `npm install` and **commit `package-lock.json`**.
3. Open a PR and let **quality checks** run on Linux — that is the real cross-platform test.
4. If CI reports missing Linux packages in the lockfile, sync the lockfile on Node 22.12+ with npm ≥ 11.3; do **not** add `.npmrc` platform hacks.

## Debugging checklist

1. Read the **exact** error: lockfile sync (`Missing: … from lock file`) vs wrong platform (`EBADPLATFORM`) vs missing binding at runtime (`Cannot find native binding`).
2. Inspect `package.json`: platform bindings should be under **`optionalDependencies`**, not `devDependencies`.
3. Confirm `.npmrc` does **not** set `os=` or `cpu=`.
4. Grep `package-lock.json` for `vitest/node_modules/@esbuild/linux-x64` and `@oxc-parser/binding-linux-x64-gnu` — both should be present for Linux CI.
5. Confirm CI uses Node **22.12** and npm **≥ 11.3** (workflow upgrades npm before `npm ci`).
6. For Husky failures in CI, confirm `HUSKY=0` and that `prepare` skips on `CI` / `VERCEL`.

## References

- [oxc troubleshooting — optional dependencies](https://oxc.rs/docs/guide/troubleshooting)
- [npm/cli#4828](https://github.com/npm/cli/issues/4828) — optional dependency install bug (fixed in npm ≥ 11.3)
- [GitHub Actions — Node 20 deprecation on action runtimes](https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/)
