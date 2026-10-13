# Theme is a user preference with three appearances

The page background is a hot-pink radial gradient, and long sessions glare. The app also splits pale pages from dark purple game modals. Theme is a signed-in user's appearance for the whole app they see, including those modals. It has three values: Neblir, Dark, and Light. Neblir is today's appearance, the pink-to-blue page gradient included, and it stays the default, including for signed-out surfaces and for a user who has not chosen. Dark is dim neutral surfaces with purple accents. Light is neutral off-white surfaces, dark text, and purple accents. Dark and Light use flat surfaces. The gradient stays as it is and belongs to Neblir only.

The choice is stored on the user and changed from user Settings (`/home/settings`), saved when they pick Neblir, Dark, or Light. It follows that user across devices. It does not follow the operating system, a game, or a catalogue environment. A game has no theme. Safe, warning, and danger keep their meanings; their shades may change so they stay readable. Body text stays clearly readable; Dark and Light quiet the large surfaces. Uploaded images, PDFs, and Discord posts stay as authored. A color an author set inside rich text stays that color. App text with no author color follows the theme. Another session that is already open shows the new theme the next time it loads the app. The session that changed it switches when the save succeeds, and stays on the previous theme if the save fails.

## Considered Options

- **Follow the device:** map the operating system's light or dark setting onto the app. Rejected because Neblir is neither, and the default must stay Neblir. A `prefers-color-scheme` block in the stylesheet only sets unused variables; it does not paint the app, and it does not become a theme.
- **This browser only:** keep the choice off the user record. Rejected because the same signed-in user should see one theme on every device.
- **Page chrome only:** restyle pale pages and leave game modals purple in every theme. Rejected because a theme is one appearance. The purple modal shell is part of Neblir, not a leftover inside Dark or Light.

## Consequences

- User Settings is the only switch. Table Settings does not gain a theme. The nav bar does not gain one.
- "Light" and "dark" on shared controls today mean a pale page versus a purple game modal. That split is Neblir. It is not the Light theme or the Dark theme.
- The gradient is left unchanged. Dark and Light do not use it. Their page, card, and modal surfaces are opaque, so the gradient does not show through.
- Dark and Light accents are the deep brand purple. The brighter game-modal violet stays part of the Neblir shell. The exact accent shade, and the exact neutral steps, may be tuned after we see them, as long as body text stays clearly readable and the accent stays the deep brand purple.
- Page, raised card, and modal are three steps of the same neutral family in Dark and in Light.
- The first paint of the signed-in app uses that user's theme. Signed-out surfaces paint Neblir immediately. Signing out leaves a signed-out surface, so it is Neblir.
- The browser toolbar color stays the deep brand purple on Neblir and while signed out. On Dark and Light it matches that theme's page surface.
- This is finished only when a signed-in user in Dark or Light never meets the pink gradient or a purple modal shell.
