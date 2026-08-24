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

### Paths

**Path**:
A character may have more than one path (one row per path). Update Character’s single path picker is the **primary path** (highest rank when the form opens). Changing it to a path the character does not have replaces only that primary row; other paths stay. Changing it to a path they already have updates that row in place.
_Avoid_: class (when meaning this)

**Favourite weapon**:
The Soldier path’s chosen weapon. Kept whenever a Soldier path row still exists after Update or Level-up.
_Avoid_: favourite item (when meaning this)
