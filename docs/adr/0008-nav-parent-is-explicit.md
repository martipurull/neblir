# Nav parent is an explicit page

The shell control on `/home` should name the page it opens and land on a page that exists. Stripping the last URL segment is what the control does today. That strip 404s on Super-admin edit, because `/home/super-admin/{domain}/{id}` is not a page. It also sends browse back into the create form, and sends a sheet opened from Known NPCs or the Game master page to Player Characters. Browser history depends on how you arrived, and a bookmark or a dead URL has nowhere real to go.

Every page has one explicit parent in the app hierarchy. The control is a link. Its text and accessible name are `← {parent title}`, and its href is that parent. It is hidden on Dashboard. A return target is allowed only where a page has more than one legitimate parent.

## Considered Options

- **Browser history:** the previous URL. The destination changes with the path you took, and a missing previous URL 404s.
- **Strip the last path segment:** matches the hierarchy only when the URL does. Super-admin edit, browse next to create, and character entry points do not.
- **Explicit parent (chosen):** each page names its parent. A character sheet, Create character, and a lore entry record which parent opened them.

## Consequences

- Settings, Characters, Games, Mechanics, World, Maps, and Super admin → Dashboard.
- A game → Games.
- Player Characters, Known NPCs, Custom items, Custom vehicles, Lore, Files, Recaps, and the Game master page → that game.
- Custom item create and custom vehicle create → Custom items and Custom vehicles.
- Table Settings and an enemy instance → the Game master page. `/gm/enemies` stays a redirect onto the Game master page so existing links still land.
- Update and Level-up → that character sheet. The sheet URL keeps its return target.
- Super-admin create, browse, and the created confirmation → Super admin. Create and browse are sibling tabs, so browse does not return to the create form.
- Super-admin edit → that catalogue domain's browse list (Items, Paths, Features, Enemies, Reference, Vehicles, Maps).

Labels use that page's title. A game's children use the game's name. Update and Level-up use the sheet's title: the character's name, or "Character" when that title is unavailable.

A return target exists only on a character sheet, Create character, or a lore entry:

- Allowed destinations are Characters, the Game master page, Player Characters, Known NPCs, and the game page. A lore entry may instead return to Table Settings.
- When the URL already names a game (a game sheet, a lore entry, or Create's game id), the return target must be that same game. Any other value is ignored.
- Fallback: an owned sheet and Create go to Characters; a game sheet goes to Player Characters; a lore entry goes to Lore.
- The nav link does not check membership. The destination page already does.
- Create's nav link uses this rule. Finishing the stepper still follows the existing redirect.

Hierarchy chevrons that repeat or contradict this parent come out: the catalogue section shell ("Super admin hub"), Super-admin create and edit forms ("Back to {domain}"), and lore entries ("Back to table settings" / "Back to lore"). Created-confirmation actions, error retries, the create and update stepper's previous step, and dice-modal toggles stay.
