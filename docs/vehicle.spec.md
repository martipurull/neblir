# Vehicle feature locked rules

1. `maxPassengers` includes the driver.
2. Multiple identical vehicles are allowed as distinct `VehicleCharacter` rows.
3. `UniqueVehicle` represents a 1:1 customized template-derived vehicle.
4. Riding changes only the displayed speed for MVP; it does not overwrite character combat stats.
5. `isBeyondRepair` is a manual boolean; operational/broken-down status is derived from HP.
6. `VehicleLocomotion[]` must contain at least one entry.
7. Character-page create/grant flows must send explicit `activeGameId` / `gameId` to the server.
8. Mounting clears `parkedAt`.
9. Dismounting requires a non-empty `parkedAt`, which is persisted.
10. `CustomVehicle` is GM-only.
11. `UniqueVehicle` can be created by GMs and players, like unique items.

## Implementation plan

### Phase 1 — Schema and hydration foundation

- Add Prisma enums for `VehicleAccessType`, `VehicleSourceType`, `VehicleLocomotion`, and `VehicleSizeCategory`.
- Add Prisma models for `Vehicle`, `CustomVehicle`, `UniqueVehicle`, and `VehicleCharacter`.
- Add `Character.activeVehicleCharacterId`.
- Add `Game.customVehicles` and `Game.uniqueVehicles` relations.
- Add `Character.vehicles` relation.
- Ensure `VehicleCharacter` allows multiple rows for the same `characterId + sourceType + vehicleId` combination; vehicles do not stack.
- Add `src/app/lib/types/vehicle.ts` with Zod schemas and TS types for:
  - official vehicles
  - custom vehicles
  - unique vehicles
  - hydrated vehicle character entries
  - derived vehicle status
- Add Prisma helpers for:
  - resolving vehicles from `GLOBAL_VEHICLE`, `CUSTOM_VEHICLE`, and `UNIQUE_VEHICLE`
  - merging unique vehicle overrides onto a base template
  - hydrating `VehicleCharacter` rows with resolved vehicle data
  - deriving `effectiveMaxHp`, derived status, and `canBeRidden`
- Extend `src/app/lib/prisma/character.ts` `getCharacter()` to include hydrated vehicles and `activeVehicleCharacterId`.
- Add focused unit tests for:
  - global/custom/unique vehicle resolution
  - unique override merging
  - derived status calculation
  - effective max HP calculation
  - `canBeRidden` logic

### Phase 2 — Official vehicle catalogue and super-admin management

- Add API routes mirroring official item catalogue flows:
  - `GET /api/vehicles`
  - `POST /api/vehicles`
  - `GET /api/vehicles/[id]`
  - `PATCH /api/vehicles/[id]`
  - `DELETE /api/vehicles/[id]`
- Add super-admin browse/create/edit/delete UI for official vehicles.
- Add catalogue drift support for the `vehicles` domain.
- Add seed/import support via `prisma/data/Vehicle_Upload.json` and a vehicle upsert/import script following existing catalogue patterns.
- Add API tests covering:
  - success cases
  - auth failures
  - validation failures
  - not found cases

### Phase 3 — Game custom vehicles and unique vehicle authoring

#### Phase 3A — Custom vehicles

- Add game-scoped custom vehicle routes:
  - `GET /api/games/[id]/custom-vehicles`
  - `POST /api/games/[id]/custom-vehicles`
  - `GET /api/games/[id]/custom-vehicles/[vehicleId]`
  - `PATCH /api/games/[id]/custom-vehicles/[vehicleId]`
  - `DELETE /api/games/[id]/custom-vehicles/[vehicleId]`
- Match item precedent:
  - read access for game members
  - create/update/delete access for the game master only
- Add GM-facing UI for browsing, creating, editing, and deleting custom vehicles.

#### Phase 3B — Unique vehicles

- Add unique vehicle authoring routes:
  - `POST /api/characters/[id]/unique-vehicles`
  - `GET /api/games/[id]/unique-vehicles`
  - `GET /api/unique-vehicles/[id]`
  - `PATCH /api/unique-vehicles/[id]`
  - `DELETE /api/unique-vehicles/[id]`
- Require the client to send explicit `gameId` for unique vehicle creation.
- Validate on the server that:
  - the character belongs to the supplied game
  - the source template belongs to the same game if it is a `CUSTOM_VEHICLE`
  - the acting user is permitted to operate in that game context
- Enforce the 1:1 unique-vehicle rule in service/API logic so the same `UniqueVehicle` cannot back multiple live owned instances.
- Add API tests covering success, permissions, validation, and 1:1 uniqueness enforcement.

### Phase 4 — Character ownership and riding API

- Add character vehicle routes:
  - `GET /api/characters/[id]/vehicles`
  - `POST /api/characters/[id]/vehicles`
  - `PATCH /api/characters/[id]/vehicles/[vehicleCharacterId]`
  - `DELETE /api/characters/[id]/vehicles/[vehicleCharacterId]`
  - `POST /api/characters/[id]/vehicles/[vehicleCharacterId]/transfer`
  - `POST /api/games/[id]/give-vehicle`
  - `PATCH /api/characters/[id]/active-vehicle`
- Ensure adding a vehicle always creates a discrete `VehicleCharacter` row rather than incrementing quantity.
- Support `VehicleCharacter` patch actions for:
  - `adjustHp`
  - `setHp`
  - `setCustomName`
  - `setParkedAt`
  - `setNotes`
  - `setMaxHpBonus`
  - `setBeyondRepair`
- Support riding actions:
  - mount a vehicle by setting `activeVehicleCharacterId`
  - dismount a vehicle by clearing `activeVehicleCharacterId` and persisting `parkedAt`
- Enforce the riding rules:
  - a character can ride at most one vehicle at a time
  - broken-down vehicles cannot be mounted
  - beyond-repair vehicles cannot be mounted
  - mounting clears `parkedAt`
  - dismounting requires a non-empty `parkedAt`
- Use a transaction when mounting or dismounting so character state and vehicle parked state update together.
- Add API tests covering:
  - mount success
  - dismount success with persisted parked location
  - dismount rejection when `parkedAt` is missing
  - mount rejection when the vehicle cannot be ridden
  - ownership and cross-game validation failures
  - transfer behavior for global/custom/unique vehicles

### Phase 5 — Character page vehicles UI (MVP)

- Add a `vehicles` section to the character page.
- Register `vehicles` in:
  - `CHARACTER_SECTION_IDS`
  - `DEFAULT_CHARACTER_SECTION_ORDER`
  - section labels/settings UI
- Add `src/app/(pages)/home/characters/[id]/sections/vehicles.tsx`.
- Register the new section in `CharacterDetailView`.
- Build the section UI to show owned vehicles with:
  - display name (`customName ?? resolved template name`)
  - image
  - current HP and effective max HP
  - derived status
  - manoeuvrability
  - combat speed and travel speed
  - vehicle size
  - locomotion badges
  - parked location when not mounted
- Add a vehicle detail modal with:
  - resolved template stats
  - instance notes/state
  - HP controls
  - beyond-repair toggle
  - mount/dismount actions
  - parked location editing
  - transfer actions
- Use existing shared form and button components per repo rules.
- If there is no active game selected, disable game-scoped create/grant actions and show a clear explanation.

### Phase 6 — Header riding display

- Update `CharacterSummaryHeader` to show when the character is riding a vehicle.
- Show the ridden vehicle name and display the vehicle’s `combatSpeedMetres` / `travelSpeedKmh`.
- Strike through the character’s own speed while mounted.
- Keep this as a display-only MVP enhancement; do not change underlying combat stat calculations yet.

### Phase 7 — Game page vehicle flows

- Add game-level browse and management pages/components for:
  - custom vehicles
  - unique vehicles
  - GM give-vehicle flow
- Mirror existing item workflows where practical.
- Ensure character-page creation and grant flows send the active selected `gameId` explicitly.

### Phase 8 — Mounted items

- Add a `VehicleMountedItem` join model instead of reusing character equip slots.
- Keep mounted items in character inventory for the initial implementation; mounting links the item to the vehicle rather than transferring ownership.
- Add attach/detach APIs and vehicle-detail UI once core vehicle ownership is stable.
- Mounted items are detached automatically when a vehicle is transferred.
- Equipped body-slot items are unequipped when mounted on a vehicle.

### Phase 9 — Cargo and passengers

- Extend vehicle support to cargo and passenger handling after the MVP is stable.
- Cargo uses inventory `itemLocation` values of the form `vehicle:<vehicleCharacterId>`.
- Stow/retrieve cargo validates optional `maxCargoWeightKg` and unequips items when stowing.
- Passenger handling stores `passengerCharacterIds` on `VehicleCharacter`, validates capacity with `maxPassengers` including the driver, and uses shared-game roster selection.
- Owner dismount clears passengers; vehicle transfer returns cargo to carried inventory and clears passengers/mounts.
- Guest riders (passengers) hydrate into character detail for header riding display without appearing as owned vehicles.

## MVP acceptance criteria

The MVP is complete when all of the following are true:

1. Super-admins can create, edit, and delete official vehicles.
2. GMs can create, edit, and delete custom vehicles for a game.
3. Players and GMs can create unique vehicles for a character within an explicit game context.
4. Characters can own multiple identical vehicles as separate rows.
5. The character page includes a `Vehicles` section.
6. Vehicle HP can be adjusted from the UI.
7. Vehicle status derives correctly from HP plus `isBeyondRepair`.
8. A character can mount at most one vehicle at a time.
9. Mounted vehicles appear in the header and strike through the character’s speed display.
10. Dismounting prompts for a location and persists `parkedAt`.
11. Broken-down or beyond-repair vehicles cannot be mounted.
12. API behavior changes introduced for vehicles are covered by tests for both success and failure paths.
