# Neblir

Tabletop RPG companion for characters, bots, inventory, and in-play health and combat state.

## Language

### Characters

**Character**:
A sheet entity. It has Owners. Whether it is a player character or a GM-controlled character is derived per game from those Owners among that game's users, not stored on the character.
_Avoid_: PC, NPC (as fields on the character)

**Owner**:
A user the character belongs to. Ownership is not play control and is not a play grant.
_Avoid_: shared owner, temporary owner (when meaning a play grant)

**Play control**:
Who may operate a character sheet in a game right now. That means in-play actions only: rolls, HP and Status, inventory, equip, wallet, vehicles, bot holdings, and combat resources. It does not include authorship or character notes.
_Avoid_: ownership, shared ownership

**Play grant**:
A GM-issued, GM-revocable permission for one player to have play control of a GM-controlled character in that game. It lasts until the GM revokes it. The character stays GM-controlled. The GM keeps play control. Leaving the game drops the grant. A character has at most one play grant at a time. In the app, only the GM and the grantee see the grant. A private game link is still visible to the grantee.
_Avoid_: shared ownership, temporary ownership, transfer, played by (as an in-app badge), co-controlled

**Roller**:
The user who emitted a roll. Discord posts `{roller} as {character}` unless the roll is private (`SECRET ROLL`). A bot roll posts `{roller} as {bot}`, using the bot's display name. Naming the roller on Discord is not an in-app play-grant badge.
_Avoid_: owner (when meaning who rolled)

**Authorship**:
Owner-only changes to the character's definition: Update Character, Level-up, unlink, and delete.
_Avoid_: edit (when meaning in-play)

**GM**:
The user recorded as the game master for that game. The GM has standing play control of every character linked to the game.
_Avoid_: owner (when meaning the GM's table role)

**Game master page**:
The GM's screen for one game, where that GM runs dice, combat, NPCs, enemies, and bots.
_Avoid_: GM page

**GM-controlled character**:
A character linked to a game whose Owners among that game's users are none or only the GM. Table fiction: NPC.
_Avoid_: NPC (as a stored type), co-controlled (when meaning a play grant)

**NPC group**:
The name that places a GM-controlled character with others on one game. Each such character has at most one per game, only the GM sees it, the same character can have a different group on another game, and spellings that differ only by case, spacing, punctuation, or a possessive 's are the same group, shown under the spelling that sorts first when several are already stored.
_Avoid_: faction, tag, folder, NPC type

**Ungrouped**:
A GM-controlled character on a game who has no NPC group. Not a stored group.
_Avoid_: default group, empty tag

**Archived**:
The built-in NPC group for GM-controlled characters set aside on that game. They stay linked to the game.
_Avoid_: deleted character, unlinked character, archive flag

**Player character**:
A character linked to a game with at least one Owner among that game's users who is not the GM.
_Avoid_: PC (as a stored type)

**Public**:
A character's game link that other players may see.
_Avoid_: known to players

**Private**:
A character's game link that other players may not see. The owner, the GM, and a play-grant grantee still see it.
_Avoid_: hidden character, secret NPC

**Known NPCs**:
The GM-controlled characters on a game whose link is public. NPC group does not change who is on it.
_Avoid_: public NPC list

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

### Official

**Official**:
Published game content, not tied to one game: items, vehicles, enemies, bots, maps, paths, features, currencies, and published reference entries (world info and game mechanics). Super-admin authors them.
_Avoid_: seed data (when meaning the live rows), global (as a stored type)

**Catalogue domain**:
A named slice of Official content: items, vehicles, enemies, bots, paths, features, maps, currencies, or published reference entries.
_Avoid_: domain (unqualified), seed type

**Promotion**:
Creating Official content from a Custom item, Custom vehicle, Custom enemy, or Custom bot that was tested in a game.
_Avoid_: upload, convert, publish (when meaning this), Catalogue sync

**Catalogue environment**:
A live Official catalogue in one named environment: development, production, or a distinct local database. A process is configured as exactly one of those; preview is development. Local may receive Catalogue sync; other environments cannot pull it as a source.
_Avoid_: db (when meaning this), staging (there is none), preview (as a fourth catalogue)

**Catalogue sync**:
A one-way copy of Official catalogue rows from a source Catalogue environment to a destination Catalogue environment. Rows match by id. Diff and apply only when this process is the destination. The destination gains missing ids and updates ids that differ (source wins). Destination-only ids stay unless the operator also chooses to delete them; in-use destination-only rows are not deleted. An Official name or published-reference slug that collides with a different id is not merged. Blocked rows are skipped; the rest apply. A failed row stays different and shows on the next diff; already-applied ids do not. Apply does not roll back other rows. It does not copy games, Characters, Custom or Unique content, or Official images.
_Avoid_: sync dbs, database sync, Promotion, seed import (the git CLI path), acknowledge repo seeds

**Official name**:
The unique name of an Official item, Official vehicle, Official enemy, Official bot, Official map, Feature, or currency within that catalogue domain. Names that differ only by case or extra spaces are the same Official name. A player-facing row and a GM-only row cannot share one.
_Avoid_: title (published reference entries use slug), custom name, currency code

**Official item**:
A published item template. Not game-scoped.
_Avoid_: custom item, unique item

**Official vehicle**:
A published vehicle template. Not game-scoped.
_Avoid_: custom vehicle, unique vehicle

**Official enemy**:
A published enemy template. Spawning it produces enemy instances.
_Avoid_: custom enemy, enemy instance

**Official bot**:
A published bot template. Not game-scoped. Super-admin authors it.
_Avoid_: global bot, custom bot, unique bot

**Official map**:
A published map. Not game-scoped.
_Avoid_: custom map

**Published reference entry**:
A global world-info or game-mechanics entry. Not game-scoped.
_Avoid_: Lore (game-scoped campaign notes)

**Currency**:
An Official wallet denomination. Super-admin authors it. Not game-scoped, and there is no GM-only currency. CONF, NORD, NAS, HUMF, and MRARK are currencies; the set is not closed.
_Avoid_: money, coin, custom currency (there is none)

**Exchange value**:
How many hundredths of one CONF a unit of this currency is worth. A whole number, at least 1. CONF's exchange value is 100, and it does not change.
_Avoid_: exchange rate, face value, value

**CONF**:
The currency exchange values are counted in, as hundredths of one CONF. Its name and exchange value do not change.
_Avoid_: base currency, peg

**Exchange**:
A play-control conversion of some of one currency a character holds into another, crediting the whole destination units the source value covers. A fraction of a unit is discarded and not shown; if no whole unit is covered, nothing is exchanged and the player is told the smallest source amount that yields one.
_Avoid_: trade, transfer, swap, transfer fee, exchange rate

**Wallet**:
The currencies a character holds. Each holding is one currency and a quantity of at least 1, and it keeps that currency when the currency is renamed.
_Avoid_: money

### Inventory and vehicles

**Stack quantity**:
How many of an item a character holds in one inventory entry. Adjustable in place; quantity 0 means the entry is gone.
_Avoid_: remove (when meaning partial discard), uses (item charge/ammo-of-a-different-kind)

**Stash**:
A name on one game where characters leave items they are not carrying while that game is active. The game shares that name until no item left in that game remains there, a rename updates that game only, spellings that differ only by case, spacing, punctuation, or a possessive 's are the same stash, shown under the first spelling saved, and one left with no active game is that character's alone.
_Avoid_: location, place, group, folder, parked location, vehicle cargo

**Nickname**:
A per-holding display name on an inventory, vehicle, or bot row (`customName`). Optional; when empty, the sheet shows the unique override or template name. Editable for every holding, not only unique items, vehicles, or bots.
_Avoid_: custom name (when meaning the unique/template name), name override

**Name override**:
The unique item, unique vehicle, or unique bot’s own name, stored on the unique record. Edited via **Edit unique**, not via nickname.
_Avoid_: nickname, custom name (ambiguous)

**Max HP bonus**:
An extra max HP on a vehicle holding or a bot holding, added to the template or unique max HP. Editable by play control of the holding character.
_Avoid_: unique max HP, maxHpOverride

**Vehicle holding notes**:
Notes on one character’s owned vehicle. They belong to that holding, not to the vehicle template.
_Avoid_: instance notes (enemy instances already use “instance”), template notes

**Custom item / custom vehicle**:
A game-scoped template the GM creates and edits from the Game master page. Changing it changes every holding of that template.
_Avoid_: unique item, unique vehicle, official item, official vehicle

**Unique item / unique vehicle**:
A user-owned instance with its own stats and image, created by a GM or player from a template or standalone. Editing it does not change other holdings.
_Avoid_: custom item, custom vehicle (those are game-scoped templates)

**Custom map**:
A game-scoped map the GM creates.
_Avoid_: official map, File (when meaning a map)

### Bots

**Bot**:
A non-sentient machine a character holds. It is its own combatant, with its own attributes and inventory placements. Not a character, not an item, and not a vehicle.
_Avoid_: drone, companion, NPC

**Custom bot**:
A game-scoped bot template the GM edits. Changing it changes every holding of that template.
_Avoid_: unique bot, official bot

**Unique bot**:
One user's bot in one game, with its own stats. Editing it does not change other holdings. It has at most one holding.
_Avoid_: custom bot, official bot

**Bot holding**:
One character's holding of one bot. The character is not an Owner of the bot. Play control of that character operates the holding.
_Avoid_: ownership, bot instance (enemy instances already use "instance")

**Bot holding notes**:
Notes on one character's bot holding. They belong to that holding, not to the bot template.
_Avoid_: template notes, character notes

**Condition**:
A bot holding's derived readiness: Operational, Broken, or Beyond repair. Beyond repair when that flag is set. Broken at 0 HP. Otherwise Operational.
_Avoid_: Status, Functional

**Upgrade**:
The integer on a bot holding for one track, from −5 up to that track's Upgrade potential. The effective value is the track's base plus this upgrade.
_Avoid_: fill, damage (when meaning a negative upgrade)

**Upgrade potential**:
The ceiling on a bot track's Upgrade, an integer from 0 to +5, authored on the template. A unique bot may override it.
_Avoid_: max potential

**Processing Power**:
A bot attribute. Its base is an integer from −5 to +5, and its Upgrade potential is an integer from 0 to +5.
_Avoid_: intelligence, Grid Protection

**Physical Power**:
A bot attribute. Its base is an integer from −5 to +5, and its Upgrade potential is an integer from 0 to +5.
_Avoid_: strength, brute force

**Finesse Capacity**:
A bot attribute. Its base is an integer from −5 to +5, and its Upgrade potential is an integer from 0 to +5.
_Avoid_: dexterity, agility

**Grid Protection**:
A bot attribute with the same base and Upgrade potential as Processing Power. It is not a bot-action attribute, and it is not part of initiative.
_Avoid_: GRID skill, GRID defence (the character roll)

**Battery**:
A bot capacity. Its base is an integer from 1 to 10, and its Upgrade potential is an integer from 0 to +5. Effective capacity is the base plus the battery upgrade, and it cannot fall below 0.
_Avoid_: ammunition, Phase

**Bot reaction cap**:
The Reaction cap authored on a bot template. It has no upper limit. The usual cap is 2. Remaining on a holding cannot exceed the cap.
_Avoid_: character level, Bot additional action

**Bot damage profile**:
The damage traits every bot has: vulnerable to GRID; resistant to Ice, Fire, Bludgeoning, Bullet, and Blade; immune to Nerve and Poison. Siike, Acid, Electricity, and Other are unmarked.
_Avoid_: general information, enemy resistances (those are authored per enemy)

**Bot action**:
A named ability on a bot's action list.
_Avoid_: Reaction, Bot additional action

**Bot additional action**:
A named ability on a bot's additional-action list. The same kind of ability as a bot action. Not a Reaction.
_Avoid_: Reaction, reaction

**Bot-installable**:
An item that may be installed on a bot. Independent of whether that item is vehicle-mountable. It may carry its own bot actions.
_Avoid_: vehicle-mountable (either flag may be set)

**Item bot actions**:
Bot actions stored on a bot-installable item. The Official or Custom item owns the list. A unique item may override it.
_Avoid_: the bot's own bot actions, vehicle actions (there are none)

**Bot-installed**:
An inventory placement for hardware fixed on one bot holding. The item must be bot-installable. The weight counts toward neither that bot's carry nor its cargo.
_Avoid_: mounted, equipped

**Bot cargo**:
An inventory placement for storage on one bot holding. The weight counts toward that bot's cargo capacity.
_Avoid_: bot-carried, character carry

**Bot-carried**:
An inventory placement for what a bot holding has in its hands or wearing. The weight counts toward that bot's carry.
_Avoid_: bot cargo, character carry

**Bot equip**:
Which bot-carried rows occupy that bot's hands or its Body slot. Separate from the character's equip slots. Foot, Head, and Brain are not bot slots.
_Avoid_: weapon option, character equip

**Bot combat value**:
An authored attack or defence on a bot template: Attack Melee, Attack Range, Defence Melee, Defence Range, or Defence GRID. Each is an integer from 1 to 5. A unique bot may override it.
_Avoid_: attack mod, defence mod (those are computed character values)

**Bot weapon option**:
One way a bot makes an Attack Melee or Attack Range roll: one bot-equipped hand weapon in that attack mode, Unarmed, or Improvised weapon.
_Avoid_: weapon option (the character's list)

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

### Combat

**Reaction**:
A per-round combat resource on a character, enemy instance, or bot holding: how many remain this round, up to that combatant’s cap. Spending one (for example to defend) reduces remaining; a reset restores remaining to the cap.
_Avoid_: Bot additional action, defence reaction cost (an area-effect item rule), clear (when meaning this restore)

**Extra dice**:
A per-roll integer added to a dice pool after that pool is formed. It may be negative. The number of dice rolled cannot fall below 0. On a bot pool it is added after the floor of 1. Play control of the holding character sets it. A bot initiative roll has none.
_Avoid_: authored bot combat value, initiative modifier

**Attack mode**:
Melee, range, throw, or GRID. One weapon can have more than one.
_Avoid_: attack type

**Weapon option**:
One way a character can make an attack roll or a damage roll: an equipped weapon in a single attack mode, Unarmed, Improvised weapon, or a GRID attack. A carried weapon that is not equipped is not a weapon option.
_Avoid_: item, weapon (when meaning a bag row)

**Unarmed**:
The no-weapon melee option. For a character it is also the no-weapon throw option. For a bot it is Attack Melee with no weapon. Its damage is 1d4 bludgeoning.
_Avoid_: Improvised weapon

**Improvised weapon**:
The no-weapon range option, for a character or for a bot's Attack Range. Its damage is 1d4 bludgeoning.
_Avoid_: Unarmed

**GRID attack**:
The weapon option for attack mode GRID: equipped Brain-item damage, plus Software Warrior dice when the character has that feature. With no damage dice it is to-hit only.
_Avoid_: GRID skill, GRID defence

**Attack roll**:
A to-hit roll for one weapon option. Any die of 8–10 is a success.
_Avoid_: damage roll

**Damage roll**:
A roll of one weapon option’s damage dice. It may follow a successful attack roll, or be made with no attack roll.
_Avoid_: attack roll, to-hit

### Enemies

**Custom enemy**:
A game-scoped enemy template the GM creates. Spawning it produces enemy instances.
_Avoid_: unique enemy, enemy instance (the template is not the combatant)

**Action notes**:
The note on one enemy action. Separate from that action’s description and from the enemy’s own notes.
_Avoid_: enemy notes, GM notes, action description

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
A character may have more than one path (one row per path). Update Character edits that full set: add paths, remove paths, and change each path’s rank. There is no privileged primary path on Update.
_Avoid_: class (when meaning this), primary path (when meaning Update’s old single-path picker)

**Rank**:
How far a character has advanced in one path. Each path row’s rank is at least 1. Across that character, path ranks must sum to level.
_Avoid_: level (when meaning progress in a single path), path level

**Unallocated level**:
How much of the character’s level is not yet assigned to path ranks (`level − sum(ranks)`). A valid character has unallocated level 0. Update Character blocks save while it is non-zero (including when ranks exceed level).
_Avoid_: unspent points, free ranks

**Feature grade slots**:
The character’s budget for owned feature grades: `2 × (level − 1)`. The sum of grades across owned features must not exceed this. Update Character blocks save when over budget.
_Avoid_: feature count (when meaning this grade budget), feature slots (ambiguous without “grade”)

**Feature legality**:
An owned feature is legal only if at least one of the character’s current path ranks satisfies that feature’s applicable paths and minimum path rank. Update Character blocks save while any owned feature is illegal, and must show why.
_Avoid_: path feature (when meaning only the catalogue link)

**Favourite weapon**:
The Soldier path’s chosen weapon. Kept whenever a Soldier path row still exists after Update or Level-up; cleared when Soldier is removed.
_Avoid_: favourite item (when meaning this)

### Appearance

**Theme**:
The signed-in user's appearance for the whole app they see, including game modals. One of Neblir, Dark, or Light. It belongs to that user alone: not to a game, not to a catalogue environment, and not to the device.
_Avoid_: mode, color scheme, system theme, table theme

**Neblir**:
The default Theme, including for signed-out surfaces and for a user who has not chosen. Today's appearance: the pink-to-blue page gradient and dark purple game modals.
_Avoid_: light theme, pale pages

**Dark**:
The low-glare dark Theme: dim neutral surfaces in three steps (page, raised card, and modal) and deep brand-purple accents. Every signed-in surface uses it, including game modals.
_Avoid_: dark mode, the purple game-modal shell, the page gradient

**Light**:
The calmer light Theme: neutral off-white surfaces in three steps (page, raised card, and modal), dark text, and deep brand-purple accents. Every signed-in surface uses it, including game modals.
_Avoid_: light theme, pale pages, Neblir, lavender page fill, the purple game-modal shell
