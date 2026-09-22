# Catalogue sync: destination pulls source; writes stay on dest

A running app has one Mongo URI. Catalogue sync copies Official catalogue rows between Catalogue environments without giving preview or local the production database. The destination process pulls an Official snapshot from the source over HTTP with a server-only pull secret, diffs against its own Official rows, and applies the overlay locally. Diff and apply run only when this process is the destination. Git seed files remain the versioned source of truth; this is not seed import and not Promotion.

## Considered Options

- **Dual Mongo URIs in one process:** the super-admin page could write dest directly from anywhere. Preview and laptops would need the production URI. A leaked preview env can overlay production Official rows.
- **Source pushes into dest:** the source holds a dest write token. Same leak: development can write production.
- **Reuse cookie `catalogue-seed-export`:** that door is a logged-in super-admin session. The session does not travel to the other Catalogue environment.
- **Off-dest live diff:** development would pull production’s Official snapshot to preview the pairing. GM-only Official JSON would sit on preview. We only diff when dest is this process; off-dest is a link to dest’s super-admin.

## Consequences

- Pullable sources are Catalogue environments with a configured URL (development, production). Local may be destination only; nothing can pull a laptop.
- Each process is configured as exactly one Catalogue environment (`development`, `production`, or `local`). Preview is development.
- Human git export stays on the cookie seed-export route. Catalogue sync uses a separate snapshot door with the same Official payload.
- Official images are unchanged: they already live in the shared catalogue bucket (ADR 0004).
