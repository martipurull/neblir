# Enemy instance numbering is stored separately from the instance label

Spawning used to bake `#N` into `name` per click, so a later spawn reused `#1` and a rename destroyed the number. We assign an **instance number** per source template, freeze a **source name** at spawn, and **compose** the **instance label** (`NS Gang Member #2`, or `Scarface (NS Gang Member #1)` after a rename) so the number survives a rename and the next spawn is max-on-the-table + 1, not a lifetime serial.

## Considered Options

- **Keep `#N` inside `name`:** cheapest, but a rename wipes the number and a new batch cannot see who is already on the table.
- **Live template name in the parentheses:** a later custom-enemy rename would rewrite every instance label; the table still knows them as the enemy they spawned.
- **High-water mark that never resets:** avoids reusing `#2` after `#3` is gone, but an empty table would keep climbing; we only refuse to fill a hole while a higher number is still present.
- **Fill gaps while siblings remain** (`#1` and `#3` → next `#2`): reintroduces a number the table already used in this fight.
