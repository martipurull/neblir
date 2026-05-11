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
- Prefer existing shared `Button`, `TextInput`, `SelectDropdown`, `Checkbox`, etc. over duplicating similar components.
- Create a new shared primitive only when no existing component can satisfy the need without awkward hacks.

## 3) Always Use Shared Button Styles

- Use `src/app/components/shared/buttonStyles.ts` for button styling decisions.
- Do not introduce ad-hoc one-off button style systems when `buttonStyles.ts` can be extended.

## 4) Respect Tailwind Theme Tokens

- Follow `tailwind.config.ts` tokens and avoid hard-coded utility colors that bypass the design system.
- Background defaults:
  - avoid `bg-white` for app surfaces
  - prefer `bg-paleBlue` variants where appropriate
- Semantic colors:
  - green states use `neblirSafe`
  - red/danger states use `neblirDanger`
  - yellow/amber warning states use `neblirWarning`
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
