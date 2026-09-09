# Neblir

Tabletop RPG companion for characters, inventory, and in-play health and combat state.

## Language

### Character health

**Status**:
A character’s life state: `ALIVE`, `DECEASED`, or `DERANGED`. Set by game mechanics and also manually editable. A character has one status; `DECEASED` trumps `DERANGED` when both tracks would complete. `DERANGED` does not block death rolls.
_Avoid_: condition, state (when meaning this enum)

**Stable**:
Table fiction for a character who is still not `DECEASED` at 0 physical HP after winning death rolls (three successes before three failures). Not a stored status. Further death rolls stay locked until physical HP rises above 0 or someone resets the death-roll track.
_Avoid_: Stable status, Unconscious status

**Death roll**:
A check while at 0 physical HP and not `DECEASED` (allowed while `ALIVE` or `DERANGED`): roll a pool of d10s (size = max(Resilience, Stamina) − serious physical injuries, minimum 1); any 8–10 marks one success box, otherwise one failure box. Three failures before three successes → `DECEASED`. Three successes before three failures → not `DECEASED` (stable). Healing above 0 physical HP clears the track. A hit taken while already at 0 physical HP and still in the death-roll cycle marks a failure instead of lowering HP. Death-roll boxes cannot be changed while `DECEASED`.
_Avoid_: death save (schema may still say `deathSaves`)

**Death-roll reset**:
Clearing all death-roll success and failure boxes while still at 0 physical HP so a new cycle can begin (e.g. after a hit while stable).
_Avoid_: revive, stabilize

**Madness roll**:
The mental mirror of a death roll (Mentality − serious trauma, minimum 1 die; same 8–10 rule). Only while `ALIVE` and at 0 mental HP — not while `DECEASED` or `DERANGED`. Three failures before three successes → `DERANGED` unless the character is already `DECEASED` (then status stays `DECEASED` and the madness track is kept). Three successes → remains not `DERANGED` at 0 mental HP (composed). Healing above 0 mental HP clears the track. A hit taken while already at 0 mental HP and still in the madness-roll cycle marks a failure instead of lowering mental HP. Madness-roll boxes cannot be changed while `DERANGED` or `DECEASED`.
_Avoid_: sanity check, mental death save

**Composed**:
Table fiction for a character who is still not `DERANGED` at 0 mental HP after winning madness rolls (three successes before three failures). Not a stored status. Further madness rolls stay locked until mental HP rises above 0 or someone resets the madness-roll track.
_Avoid_: Composed status, sane

**Madness-roll reset**:
Clearing all madness-roll success and failure boxes while still at 0 mental HP so a new cycle can begin.
_Avoid_: restore sanity

**Serious physical injury**:
A 0–3 counter of major bodily harm. Reduces the death-roll dice pool (one die per injury, minimum one die). At 3, game mechanics set `DECEASED`.
_Avoid_: major injury (as a separate stored field)

**Serious trauma**:
A 0–3 counter of major mental harm. Reduces the madness-roll dice pool (one die per trauma, minimum one die). At 3, game mechanics set `DERANGED`.
_Avoid_: madness counter (the roll track is separate)

### Inventory and vehicles

**Stack quantity**:
How many of an item a character holds in one inventory entry. Adjustable in place; quantity 0 means the entry is gone.
_Avoid_: remove (when meaning partial discard), uses (item charge/ammo-of-a-different-kind)

**Nickname**:
A per-holding display name on an inventory or vehicle row (`customName`). Optional; when empty, the sheet shows the unique override or template name. Editable for every holding, not only unique items or vehicles.
_Avoid_: custom name (when meaning the unique/template name), name override

**Name override**:
The unique item or unique vehicle’s own name, stored on the unique record. Edited via **Edit unique item/vehicle**, not via nickname.
_Avoid_: nickname, custom name (ambiguous)

**Max HP bonus**:
An extra max HP on a character’s vehicle holding, added to the template or unique max HP. Editable on the character sheet for any owned vehicle.
_Avoid_: unique max HP, maxHpOverride

**Custom item / custom vehicle**:
A game-scoped template the GM creates and edits from the GM page. Changing it changes every holding of that template.
_Avoid_: unique item, unique vehicle

### Files and lore

**File**:
A per-game image or PDF stored on the Files page for play.
_Avoid_: handout (as a type), lore (when meaning a File)

**Lore**:
A game-scoped campaign note: rich text with optional image or PDF attachments.
_Avoid_: File, recap, the unused `Game.lore` string

**Recap**:
A per-game session-summary PDF, separate from Files and Lore.
_Avoid_: File, lore

### Enemies

**Custom enemy**:
A game-scoped enemy template the GM creates. Spawning it produces enemy instances.
_Avoid_: unique enemy, enemy instance (the template is not the combatant)

**Enemy instance**:
A combatant spawned into a game from an official enemy or a custom enemy. It has its own name, HP, and status.
_Avoid_: enemy (when meaning the live combatant), custom enemy (the template)

**Instance name**:
The GM-editable label on an enemy instance. It starts as the template name or the spawn name override. Changing it is a rename; it is not the instance number.
_Avoid_: nickname, name override (spawn override sets this label, then it is just the name)

**Source name**:
The official enemy or custom enemy name captured when the enemy instance is spawned. It does not change if the template is later renamed. After a rename it appears in parentheses with the instance number.
_Avoid_: enemy name, instance name

**Instance number**:
The `#N` assigned to an enemy instance at spawn from a given template in that game. The next number is one more than the highest instance number still on the table for that template (an unsuffixed singleton counts as 1). When none remain, numbering starts over. Defeated and dead instances still occupy their number. The number stays with the instance after a rename.
_Avoid_: suffix (as a separate field), name override

**Instance label**:
How an enemy instance is shown: `{instance name}` for an unsuffixed singleton, `{instance name} #{N}` when the number is visible and the GM has not renamed it, `{instance name} ({source name} #{N})` after a rename (including `#1` for a former singleton). Players see `Enemy` when the instance is private.
_Avoid_: display name (initiative also uses that for characters)

### Paths

**Path**:
A character may have more than one path (one row per path). Update Character’s single path picker is the **primary path** (highest rank when the form opens). Changing it to a path the character does not have replaces only that primary row; other paths stay. Changing it to a path they already have updates that row in place.
_Avoid_: class (when meaning this)

**Favourite weapon**:
The Soldier path’s chosen weapon. Kept whenever a Soldier path row still exists after Update or Level-up.
_Avoid_: favourite item (when meaning this)
