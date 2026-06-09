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
- **Do not use raw `<input>` or `<textarea>` in feature code** for standard text, search, email, or number entry. Compose **`TextField`**, **`TextArea`**, **`NumberField`**, **`TextInput`**, **`NumberInput`**, **`ModalNumberField`**, **`Checkbox`**, **`RadioGroup`**, **`SelectDropdown`**, or **`RichTextField`** instead. Pasting field Tailwind (including `darkTextFieldClassName` on a bare `<input>`) duplicates the primitives and drifts from the design system.
  - **Allowed native exceptions:** `type="file"` (prefer **`ImageUploadDropzone`** + **`useImageUpload`** for images), `type="hidden"` for react-hook-form, and native controls **inside** shared primitives (`TextField`, `NumberField`, `Checkbox`, etc.) that intentionally wrap the DOM element.
  - **Inline compact qty** (e.g. browse-row ± flanking a small number): use **`NumberField variant="dark" density="compact"`** (no ± rail); keep external **`Button`** steppers with **`modalIconStepperCompact`**.
- **Text entry on light pages** (dark text, `bg-paleBlue` field surface — not browser white):
  - Use **`TextField`** (`variant="light"`, default) and **`TextArea`** for primitive single-line and multi-line controls.
  - With **`react-hook-form`** and **`FormProvider`**, prefer **`TextInput`** and **`NumberInput`** (they compose `TextField` / **`NumberField`** and include label + `Controller` wiring).
  - **`NumberField`** / **`NumberInput`**: ± steppers use **`stepperStep`** (defaults to **1** — integer bumps). The native input **`step`** is separate (`step="any"` on float fields such as weight so users can type decimals manually). Do not tie fractional **`step`** values to the rail unless **`stepperStep`** is set explicitly. Use **`density="compact"`** when the field sits between external ± controls (no built-in rail).
  - Use **`SelectDropdown`** for searchable selects; menu filters use **`TextField density="compact"`** (light) or **`variant="dark" density="compact"`** in **`ModalSelect`**.
  - If you need another size or density, extend **`inputStyles.ts`**, **`darkInputStyles.ts`**, and/or add optional props on the shared primitive—avoid pasting one-off Tailwind field strings into feature code.
  - **Image uploads**: reuse **`useImageUpload`** (`src/hooks/use-image-upload.ts`) + **`ImageUploadDropzone`** (`src/app/components/shared/ImageUploadDropzone.tsx`).
  - Code under **`src/app/components/shared/`** must not import from feature folders (`games/`, `character/`, etc.). Dark/light field tokens live in **`darkInputStyles.ts`** / **`inputStyles.ts`**; catalogue constants live in **`src/app/lib/constants/`**.
- **Dark game modals** (purple shell, white/light text, transparent or tinted fields): use **`TextField variant="dark"`**, **`TextArea variant="dark"`**, **`NumberField variant="dark"`**, **`FieldLabel variant="dark"`**, and **`ModalNumberField`**. Style tokens live in **`darkInputStyles.ts`**—extend tokens or primitives there; do not put `darkTextFieldClassName` on a raw `<input>` in feature folders.
- **TipTap rich text (StarterKit + toolbar)**:
  - Reuse **`RichTextField`** (`src/app/components/shared/RichTextField.tsx`) with **`variant="light"`** (default) on paleBlue pages or **`variant="dark"`** on `modalBackground` shells (character notes, game modals). Wire with **`Controller`** from `react-hook-form` on light pages — same as character **`BackstoryStep`**. For JSON document fields (e.g. reference `contentJson`), use **`RichTextJsonField`**. To **display** stored HTML, use **`StoredRichTextHtml`** (`legacyNoteContent` for character notes with legacy JSON); for TipTap JSON-only fields, use **`RichTextJsonHtml`**.
  - **`GameModalRichTextField`** (`src/app/components/games/shared/GameModalRichTextField.tsx`) is a labeled wrapper for react-hook-form game modals; prefer **`RichTextField variant="dark"`** for new dark-modal editors when a label wrapper is not needed.
  - Do **not** introduce a parallel TipTap stack (extensions, toolbar, serialization) for the same use case; extend the existing helpers in `src/app/lib/tiptap/richText.ts` (HTML strings) and `src/app/lib/tiptap/richTextJsonDoc.ts` (JSON documents) if behaviour must change.
- Prefer existing shared `Button`, `TextField`, `TextArea`, `TextInput`, `NumberInput`, `SelectDropdown`, `Checkbox`, etc. over duplicating similar components.
- Create a new shared primitive only when no existing component can satisfy the need without awkward hacks.

## 3) Always Use Shared Button Styles

- Use **`Button`** (`src/app/components/shared/Button.tsx`) with variants from **`buttonStyles.ts`** for actions—not raw `<button>` with ad-hoc Tailwind.
- Do not introduce ad-hoc one-off button style systems when **`buttonStyles.ts`** can be extended (e.g. **`modalIconStepperCompact`** for inline ± controls, **`modalBrowseListRow`** / **`modalBrowseListRowSelected`** for selectable dark lists, **`modalActionBlock`** for full-width modal nav blocks).
- **Next.js `Link` styled as a button** cannot use **`Button`**; compose **`linkAsModalActionBlockClassName`** (or similar layout helper) with **`appButtonVariantClassName`** from **`buttonStyles.ts`** — see **`CharacterNameActionsModal`**.
- Internal sub-controls (e.g. chevrons inside **`NumberFieldStepperRail`**) may stay native `<button>` elements but must use shared class tokens from **`inputStyles.ts`**, not duplicated strings.

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

## 10) Prefer Nullish Coalescing Over Logical OR

- Prefer the nullish coalescing operator (`??`) over logical OR (`||`) when providing a fallback for `null` or `undefined`.
- `??` only substitutes when the left-hand side is `null` or `undefined`; `||` also treats `0`, `""`, and `false` as missing, which can hide valid values.
- Use `||` only when you intentionally want to fall back for any falsy value.

## 11) React Hooks Must Run Unconditionally

- Call hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, custom hooks, etc.) at the **top level** of a component or custom hook—never inside `if`, loops, or after an early `return`.
- React requires the **same hooks in the same order on every render**; a conditional return _before_ hooks breaks that contract and triggers rules-of-hooks errors.
- When a component should render nothing for some props (for example path-specific UI), use one of these patterns:
  - Compute a boolean (for example `const isSoldier = path.name === PathName.SOLDIER`), run all hooks unconditionally, gate side effects inside `useEffect` with that boolean, then `if (!isSoldier) return null` **after** the hooks.
  - Extract the conditional UI into a child component that is only mounted when needed.
  - Move stateful logic into a custom hook called unconditionally at the top level.
- **Do not reset React state in `useEffect` when props or context change** (for example `setQuantity("1")` when `item.id` or `isOpen` changes). That causes an extra render, hurts performance, and violates the project ESLint rule against synchronous `setState` in effect bodies.
- **Prefer resetting local UI state by remounting** instead: extract the stateful slice into a child component and pass a stable **`key`** tied to the identity you are resetting on (for example `key={item.id}` on a modal footer form). A new key unmounts the old instance and mounts a fresh one with initial `useState` values.
- **Reserve `useEffect` for synchronizing with external systems**—DOM APIs, timers, subscriptions, fetches, third-party widgets—not for mirroring props into state. If you must derive state from props without remounting, adjust during render only when the driving value changed (see [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)), or store the minimum state and compute the rest during render.
  - Example: resetting child UI when a modal closes—**do not** `useEffect(() => { if (!isOpen) setX(false); }, [isOpen])`. Compare the prop to a stored previous value during render and reset there (see **`GameFormModalDraftChrome`**, **`TypeToConfirmDangerModal`**), or remount the child with `key={isOpen ? "open" : "closed"}`.
