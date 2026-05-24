# AGENTS

This file defines global instructions for AI-assisted code changes in this repository.
These rules apply to every task unless the user explicitly overrides them.

## 1) API Changes Require Tests

- When adding or modifying any API endpoint, add or update tests in the same change.
- Cover both:
  - success path(s)
  - failure/error path(s) (validation, not found, permissions, or server failures as relevant)
- Do not leave API behavior changes without corresponding test coverage.

## 2) Reuse Shared Components First

- Before creating new UI primitives, check and reuse existing components in:
  - `src/app/components/shared`
- **Text entry on light pages** (dark text, `bg-paleBlue` field surface — not browser white):
  - Use **`TextField`** and **`TextArea`** (`TextField.tsx`, `TextArea.tsx`) for primitive single-line and multi-line controls.
  - With **`react-hook-form`** and **`FormProvider`**, prefer **`TextInput`** and **`NumberInput`** (they compose `TextField` and include label + `Controller` wiring).
  - Use **`SelectDropdown`** for searchable selects; its menu filter uses **`sharedTextFieldCompactClassName`** from `inputStyles.ts`.
  - If you need another size or density, extend **`inputStyles.ts`** and/or add optional props on the shared primitive—avoid pasting one-off Tailwind field strings into feature code.
- **Dark game modals** (purple shell, white/light text, transparent or tinted fields): keep **`modalInputClass`**, **`modalNumberInputClass`**, **`ModalNumberField`**, and related patterns in `src/app/components/games/shared/modalStyles.ts` (and e.g. `ModalSelect` filter styles). Do **not** drop in `TextField` / `TextArea` for those surfaces—they target the light-page theme.
- **TipTap rich text (StarterKit + toolbar)**:
  - On **light** pages, reuse **`GeneralInformationRichTextField`** (`src/app/components/character/GeneralInformationRichTextField.tsx`) with **`Controller`** from `react-hook-form` — same wiring as character **`BackstoryStep`** (`generalInformation.backstory` / `summary`).
  - On **dark game modals**, reuse **`GameModalRichTextField`** (`src/app/components/games/shared/GameModalRichTextField.tsx`).
  - Do **not** introduce a parallel TipTap stack (extensions, toolbar, serialization) for the same use case; extend the existing helpers in `src/app/lib/tiptap/generalInformationRichText.ts` if behaviour must change.
- Prefer existing shared `Button`, `TextField`, `TextArea`, `TextInput`, `NumberInput`, `SelectDropdown`, `Checkbox`, etc. over duplicating similar components.
- Create a new shared primitive only when no existing component can satisfy the need without awkward hacks.

## 3) Always Use Shared Button Styles

- Use `src/app/components/shared/buttonStyles.ts` for button styling decisions.
- Do not introduce ad-hoc one-off button style systems when `buttonStyles.ts` can be extended.

## 4) Respect Tailwind Theme Tokens

- Follow `tailwind.config.ts` tokens and avoid hard-coded utility colors that bypass the design system.
- Background defaults:
  - avoid `bg-white` for app surfaces
  - prefer `bg-paleBlue` variants where appropriate
- **Form control surfaces** on light pages follow §2 (`TextField`, `TextArea`, `TextInput`, `NumberInput`, `inputStyles.ts`); do not rely on the browser default background for inputs or textareas.
- Semantic colors (`neblirSafe`, `neblirWarning`, `neblirDanger`, and `modalBackground` in `tailwind.config.ts`):
  - Each is a **palette** with stops `200`, `400`, and `600`, plus **`DEFAULT`** (same hex as `600`). Utilities without a stop use `DEFAULT` (for example `border-neblirSafe`, `text-neblirDanger`).
  - Use an explicit stop when you need a lighter or different emphasis (for example `border-neblirSafe-400`, `bg-neblirWarning-200/30`).
  - Green states use `neblirSafe`; red/danger use `neblirDanger`; yellow/amber warnings use `neblirWarning`.
- Prefer theme token classes and extend theme tokens only when necessary.

## 5) Keep Components Small and Composable

- Avoid large monolithic components.
- Extract reusable/stateful logic into custom hooks when component complexity grows.
- Prefer composition of smaller presentational components over deep inline logic blocks.

## 6) Refactor Consistently With Existing Patterns

- When refactoring, align with patterns already used in nearby/related components and features.
- Keep naming, file organization, and implementation style consistent with the local area of the codebase.
- Avoid introducing a new architecture style in a single isolated change.

## 7) Minimize Styling Drift

- Reuse existing style patterns and shared components before adding new classes or tokens.
- Add new styles/tokens only when existing options do not satisfy the requirement.
- When adding new style primitives, keep them reusable and consistent with current app style conventions.

## 8) Avoid Unnecessary Imports

- Do not add a default React import (`import React from "react"` or `import React, { ... } from "react"`) unless the file explicitly uses the `React` namespace (for example `React.FC`, `React.Fragment`, `React.createElement`, `React.Children`).
- This project relies on the automatic JSX runtime; JSX does not require `React` to be in scope.
- Import only what you use from `"react"` and other modules (named hooks, types, etc.), and remove unused imports instead of leaving them for “consistency” or tooling noise.

## 9) Prefer Named Exports

- Use **named exports** for application code: components, hooks, utilities, and library modules under `src/`.
  - Prefer `export function Foo`, `export const Foo`, or `export const Foo = forwardRef(...)` (see `TextField`, `SelectDropdown`).
  - Import with `import { Foo } from "..."` so symbol names stay stable for refactors and search.
- **Do not** add new `export default` in app/library code. ESLint enforces this as an **error** (`no-restricted-syntax` on `ExportDefaultDeclaration`).
- **Exceptions** (framework or tooling contracts that require a default export):
  - Next.js App Router special files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `global-error.tsx`, `not-found.tsx`, `template.tsx`, `default.tsx`
  - `manifest.ts` (and other Next metadata route modules that export a default)
  - `src/auth.config.ts` (Auth.js edge-safe config consumed as a default import)
- When touching a file that still uses a default export outside those exceptions, convert it to a named export in the same change when practical.
- Root tooling configs that require a default export (`tailwind.config.ts`, `vitest.config.ts`, `next.config.mjs`, etc.) are excluded in `eslint.config.mjs`; keep their existing export style unless you are already changing them.
