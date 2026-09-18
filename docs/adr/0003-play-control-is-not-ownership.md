# Play control is not ownership

A second Owner would reclassify a GM-controlled character as a player character, and owner-only APIs would light up including authorship and notes. We keep **Owner** as who the character belongs to, and add **play control** (in-play sheet operation in a game) plus a revocable **play grant** for a player on a GM-controlled character. The GM has standing play control of every linked character; that is not a grant.

## Considered Options

- **Co-own via a second Owner row:** simplest data change, but the character becomes a player character until the row is removed, and the player gains authorship.
- **Transfer ownership:** the GM gives the character away — the opposite of a temporary, revocable grant.
- **Play control + play grant (chosen):** NPC identity stays derived from Owners; in-play access is a separate, game-scoped fact.

## Consequences

- The grantee opens a **game-scoped** sheet, not My Characters.
- In the app, other players do not see a play-grant badge. Discord already posts `{roller} as {character}` for public rolls; that attribution is allowed and is not the same thing.
