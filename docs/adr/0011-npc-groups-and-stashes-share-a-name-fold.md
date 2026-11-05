# NPC groups and stashes share a name fold

NPC groups already treated case and extra spaces as the same name, and kept the first spelling. Stashes need the same treatment, plus punctuation and a possessive `'s`, so that "Indira's Flat", "Indira flat", and "Indira's flat" are one place. NPC groups and stashes share that stricter fold. One helper implements it. Official names stay on case and extra spaces only.

## Considered Options

- **A stricter fold for stashes only:** NPC groups would keep merging on case and spaces, and "Indira's Crew" would stay distinct from "Indira Crew". That leaves two folding rules to maintain, which is what the shared helper was meant to avoid.
- **Strip apostrophes and leave the s:** "Indira's Flat" becomes "Indiras Flat", which still does not match "Indira flat".
- **Drop any trailing s:** "Guns" and "Gun" would collapse. A trailing s is removed only when it is the possessive after an apostrophe.

## Consequences

- Saving a new NPC group or stash keeps the spelling already stored for that fold. When several matching spellings are already stored, the heading shown is the one that sorts first.
- Existing NPC groups that now match collapse into one group on the list. Archived and Ungrouped stay reserved after folding, so "Archived!" and "archived's" are still Archived. A stash may be named Archived.
- A name that is empty after the fold, whose fold is `carried`, or whose trimmed text is a vehicle cargo or mounted location is rejected. The message tells the player, in plain language, to choose a place name or to use the vehicle's cargo or mount controls.
