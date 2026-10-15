# Currencies are catalogue rows counted in CONF

Currencies were a closed enum with no exchange. A currency is Official catalogue content: a unique name, an image, and an exchange value counted in CONF, and super-admins add them. An exchange spends the source amount the player entered and credits the whole destination units that value covers; any fraction of a unit is discarded and not shown, so a new currency does not need a schema change and play always settles in whole units.

## Considered Options

- **Keep the closed enum:** wallet code stays simple, but every new currency is a schema change, and there is nowhere to store an exchange value.
- **Refuse an exchange unless it divides evenly:** no value is discarded, but players cannot exchange amounts that are not exact multiples.
- **Take the source amount even when the destination rounds to zero:** the whole payment disappears. We refuse that case and tell the player the smallest source amount that yields one destination unit.
- **Show the discarded fraction as a transfer fee:** it is not a stored charge. Naming it would make the sheet explain a loss we chose not to surface.
- **Store the decimal rates:** CONF stays 1 and a currency can be worth a fraction of a CONF, but those fractions are not exact binary values, so the whole destination units can be off by one. We count exchange values in hundredths of one CONF instead.

## Consequences

- Currency is a catalogue domain. Rows travel with seed import, seed export, and catalogue sync. `Currency_Upload.json` holds the name, the exchange value, and the image key. The original non-CONF exchange values are written there before import; they are not invented in code.
- CONF's name does not change, and its exchange value stays 100. Every exchange value is a whole number of hundredths of one CONF, at least 1. An exchange uses those stored numbers directly: the destination units are the floor of (source amount times source exchange value) divided by destination exchange value. Dividing by 100 again drops a real credit. Five units at exchange value 44 into CONF credits 2. Changing an exchange value does not rewrite wallet quantities.
- A holding points at the currency row. Renaming a currency does not rewrite holdings. A currency that a character holds cannot be deleted. There is no GM-only currency and no custom currency.
- Exchange value is shown only while exchanging, together with the whole number of destination units the amount will add. The wallet list shows the image, the quantity, and the name.
- An exchange that would credit zero does not run. The player is told the smallest amount of the source currency that yields one unit of the destination.
- Currency images live in the shared catalogue bucket. Super-admins upload them under the `currencies-` prefix, including replacements of the original five keys.
