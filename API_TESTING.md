# API End-to-End Testing Guide

This document contains manual CURL requests for testing the Neblir API functionality end-to-end.

## Prerequisites

- The development server should be running on `http://localhost:3000`
- You should have at least one user account created
- You'll need to authenticate and capture the session cookie for protected endpoints

**Tip (shell quoting):** For short JSON bodies you can use `-d '{ ... }'` (single quotes so double quotes inside need no escaping). If the body contains **apostrophes** (e.g. "taker's", "GM's") or is **long and complex**, use `--data-binary @- << 'EOF'` and put the raw JSON between the EOF markers so the shell does not interpret quotes or newlines.

## Base Configuration

```bash
# Set your base URL
BASE_URL="http://localhost:3000"

# You'll need to capture your session cookie after logging in
# Replace this with your actual cookie value
SESSION_COOKIE="eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2Q0JDLUhTNTEyIiwia2lkIjoiUGNDamIxVDRNRFpXLVo4bU9YZF9SXzcyMUJOaTJtWWNzSGgwaHpva2MwZ0ljMmx2Y0dMaGVvRU41V1hmaHMybkprSjVsWmgxOVh2RHpPWDMxUHk0TFEifQ..JGwwsmE4vQg5k3pbicp4yg.6PK1BDkZ66TWBlGI1sJs2kxXdfk93dXyZTdbpJoXsBqEb9oHwBOQeiUc25gVg1Q2cZVAEJ_zLr4e_JLwXDg67LbpbjYjW6k7IDc68TJDi92Uhn04es4bBYczX2wExLqb2aMC8jAesbCeVhH2LyPfHO0q-BX5P-N486sXy6kpRXBvV2eOxEJVqoBgWmEwwm_93lwQ52ceSsn6QJg2xN4urkqMn6FwfesSuXHPZdKsFkFE4yoZIlxaFKJ-qCb6CdQcKW7YYlEflDkArF3ZZ7XhmGFU3fZ_L7W7O1X0DuN7YzubHqGVdv5EJCGZZV3pDUJch2LEqh9PxbfDEBw8PRIn5KuuIE5QVUjDgpPxoROhFSA4BTkUcryPK6nyTcs6Wz-qrM3XN7PiwR4ORASiVqJU0k6UoAgZWaF3On_kXoLo39q85ScrYZ6RwJ8_f7G9ju2ATyegS92YgHKjj2e_uTUrZsnipWeIi2jUGGD9YB1O7UNjD9WZRpUaeKnloBm2AeVMwciOljeQuk3u7oZlW_8JeA.uQQ11XgBeeHxYylUlqlDv7cFadmC07JB2-T1GinUg_U"
```

## Authentication

### Step 1: Get Session Cookie

Since the app uses NextAuth with Google OAuth, you'll need to:

1. Open your browser and navigate to `http://localhost:3000/signin`
2. Sign in with your Google account
3. Open browser DevTools (F12) → Application/Storage → Cookies
4. Find the cookie named `authjs.session-token` (or similar NextAuth session cookie)
5. Copy its value
6. Save it to a variable in the terminal (i.e. export SESSION_COOKIE=<your-cookie>)

Alternatively, you can use browser DevTools Network tab to capture the cookie from any authenticated request.

**Note:** The cookie name may vary. Common names:

- `authjs.session-token`
- `__Secure-authjs.session-token`
- `next-auth.session-token`

---

## Character Management

### Create a Character

This is the main character creation endpoint. It requires authentication and creates a character with all necessary attributes.

```bash
curl -X POST "${BASE_URL}/api/characters" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "generalInformation": {
      "name": "Alex",
      "surname": "Rivers",
      "age": 28,
      "religion": "HUMANISM",
      "profession": "Field Researcher",
      "race": "HUMAN",
      "birthplace": "New Haven",
      "level": 1,
      "height": 175,
      "weight": 70,
      "avatarKey": "characters-alexandra_rivers.png"
    },
    "health": {
      "rolledPhysicalHealth": 12,
      "rolledMentalHealth": 10,
      "seriousPhysicalInjuries": 0,
      "seriousTrauma": 0,
      "status": "ALIVE"
    },
    "combatInformation": {
      "armourMod": 0,
      "armourMaxHP": 0,
      "armourCurrentHP": 0,
      "GridMod": 0
    },
    "innateAttributes": {
      "intelligence": {
        "investigation": 2,
        "memory": 2,
        "deduction": 2
      },
      "wisdom": {
        "sense": 2,
        "perception": 4,
        "insight": 1
      },
      "personality": {
        "persuasion": 2,
        "deception": 1,
        "mentality": 2
      },
      "strength": {
        "athletics": 1,
        "resilience": 2,
        "bruteForce": 1
      },
      "dexterity": {
        "manual": 3,
        "stealth": 1,
        "agility": 3
      },
      "constitution": {
        "resistanceInternal": 3,
        "resistanceExternal": 2,
        "stamina": 2
      }
    },
    "learnedSkills": {
      "generalSkills": {
        "mechanics": 1,
        "software": 0,
        "generalKnowledge": 3,
        "history": 2,
        "driving": 1,
        "acrobatics": 0,
        "aim": 2,
        "melee": 0,
        "GRID": 0,
        "research": 4,
        "medicine": 1,
        "science": 0,
        "survival": 0,
        "streetwise": 0,
        "performance": 0,
        "manipulationNegotiation": 1
      },
      "specialSkills": ["Field Research", "Data Analysis"]
    },
    "wallet": [
      {
        "currencyName": "CONF",
        "quantity": 500
      }
    ],
    "path": {
      "pathId": "692a2e886f6040cf47955002",
      "rank": 1
    }
  }'
```

**Expected Response:** 201 Created with the full character object including computed fields.

**Important Notes:**

- **Do NOT include `userId` in the request** - the user ID is automatically extracted from your authenticated session. The character will be associated with the logged-in user automatically.
- **Do NOT include `maxCarryWeight` in `combatInformation`** - it is automatically computed from race and strength attributes. Including it may cause validation errors.
- The following fields are computed automatically and should NOT be included in the request:
  - `combatInformation.maxCarryWeight` (computed from race + strength)
  - `combatInformation.initiativeMod`, `speed`, `reactionsPerRound` (computed)
  - `combatInformation.rangeAttackMod`, `meleeAttackMod`, `GridAttackMod` (computed)
  - `combatInformation.rangeDefenceMod`, `meleeDefenceMod`, `GridDefenceMod` (computed)
  - `health.innatePhysicalHealth`, `maxPhysicalHealth`, `currentPhysicalHealth` (computed)
  - `health.innateMentalHealth`, `maxMentalHealth`, `currentMentalHealth` (computed)

### Get Character by ID

```bash
CHARACTER_ID="6997975709a2f5cd8c487604"

curl -X GET "${BASE_URL}/api/characters/${CHARACTER_ID}" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

**Expected Response:** 200 OK with character object.

### Delete Character

```bash
CHARACTER_ID="your-character-id-here"

curl -X DELETE "${BASE_URL}/api/characters/${CHARACTER_ID}" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

**Expected Response:** 204 No Content.

---

## Character Updates

### Update General Information

```bash
CHARACTER_ID="your-character-id-here"

curl -X PATCH "${BASE_URL}/api/characters/${CHARACTER_ID}/general-info" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "name": "Alexandra",
    "age": 29,
    "profession": "Senior Field Researcher"
  }'
```

### Update Health

```bash
CHARACTER_ID="your-character-id-here"

curl -X PATCH "${BASE_URL}/api/characters/${CHARACTER_ID}/health" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "currentPhysicalHealth": 0,
    "currentMentalHealth": 15,
    "seriousPhysicalInjuries": 1,
    "seriousTrauma": 0,
    "deathSaves": {
      "successes": 1,
      "failures": 3
    }
  }'
```

**Note:** All fields are optional. You can update any combination of:

- `currentPhysicalHealth` (cannot exceed maxPhysicalHealth)
- `currentMentalHealth` (cannot exceed maxMentalHealth)
- `seriousPhysicalInjuries` (0-3, status becomes DECEASED at 3)
- `seriousTrauma` (0-3, status becomes DERANGED at 3)
- `deathSaves` (object with successes and failures, both 0-3)

### Update Combat Information

```bash
CHARACTER_ID="your-character-id-here"

curl -X PATCH "${BASE_URL}/api/characters/${CHARACTER_ID}/combat-info" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "armourMod": 2,
    "armourMaxHP": 10,
    "armourCurrentHP": 10,
    "GridMod": 1
  }'
```

**Note:** All fields are optional. You can update:

- `armourMod`: Armour modifier (affects defence mods and armourMaxHP automatically)
- `armourCurrentHP`: Current armour hit points (set to 0 to destroy armour)
- `GridMod`: GRID modifier (affects GRID attack and defence mods automatically)

Setting `armourCurrentHP` to 0 will automatically set `armourMod` to 0 and recalculate defence mods.

### Update Wallet

```bash
CHARACTER_ID="your-character-id-here"

curl -X PATCH "${BASE_URL}/api/characters/${CHARACTER_ID}/wallet" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '[
      {
        "currencyName": "NORD",
        "quantity": 750
      },
      {
        "currencyName": "CONF",
        "quantity": 5
      }
    ]'
```

**note** The calculation is done in the frontend. The backend has protection against negative quantities and invalid currencies.

### Update Notes

```bash
CHARACTER_ID="your-character-id-here"

curl -X PATCH "${BASE_URL}/api/characters/${CHARACTER_ID}/notes" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '[
      "Met with the research team in Sector 7",
      "Discovered unusual energy readings",
      "Need to investigate further"
    ]'
```

---

## Items Management

### Create a General Item

For bodies that contain apostrophes (e.g. "taker's", "GM's") or long text, use a heredoc so the shell does not interpret quotes:

```bash
curl -X POST "${BASE_URL}/api/items" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  --data-binary @- << 'EOF'
{
  "type": "GENERAL_ITEM",
  "accessType": "PLAYER",
  "name": "HyperFocus",
  "description": "A drug devised to enhance the taker's ability to focus their attention on a subject.",
  "confCost": 500,
  "costInfo": "Price per packet of 10. It may be cheaper, but less safe, in the blackmarket.",
  "usage": "One pill gives the taker 2d10 on any Investigation-based roll requiring attention to detail: this could be a crime scene if enough time is given, or a scientific paper. However, any Perception-based check is at minus 2d10 penalty. The effects can be doubled by taking two pills at once, but the character won't be able to sleep for a day, incurring a level of Exhaustion; additionally, a Resistance (Internal) is required, and the character takes 1d6 Mental damage on a failure. Addictive: taking one pill every day for three or more days or taking two or more pills on the same day causes addiction. Addiction forces the user to take one pill per day or suffer three days of all Investigation- AND Perception-based rolls with minus 2d10 penalty, after which, the user is clean. After 5 consecutive days of usage, the process to clean up takes 5 days. After 6 days, the addiction requires professional help at the GM's discretion.",
  "weight": 0.1
}
EOF
```

### Create a Weapon

```bash
curl -X POST "${BASE_URL}/api/items" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "type": "WEAPON",
    "accessType": "PLAYER",
    "name": "Plasma Pistol",
    "description": "A compact energy weapon",
    "confCost": 200,
    "costInfo": "Restricted item, requires permit",
    "weight": 1,
    "attackRoll": ["RANGE"],
    "attackBonus": 2,
    "damage": {
      "diceType": 6,
      "numberOfDice": 2,
      "damageType": "FIRE",
      "primaryRadius": 0,
      "secondaryRadius": 0
    },
    "notes": "Standard issue for field researchers in dangerous zones"
  }'
```

### Create a Weapon with Area Effect

```bash
curl -X POST "${BASE_URL}/api/items" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "type": "WEAPON",
    "accessType": "PLAYER",
    "name": "Plasma Grenade",
    "description": "Explosive device with area damage",
    "confCost": 75,
    "costInfo": "Illegal in most sectors",
    "weight": 1,
    "attackRoll": ["THROW"],
    "attackBonus": 0,
    "damage": {
      "diceType": 6,
      "numberOfDice": 5,
      "damageType": "FIRE",
      "primaryRadius": 5,
      "secondaryRadius": 10,
      "areaEffect": {
        "defenceReactionCost": 1,
        "defenceRoll": "Agility + Acrobatics",
        "successfulDefenceResult": "Half damage"
      }
    }
  }'
```

### Get All Items

```bash
curl -X GET "${BASE_URL}/api/items" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

### Get Item by ID

```bash
ITEM_ID="your-item-id-here"

curl -X GET "${BASE_URL}/api/items/${ITEM_ID}" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

---

## Character Inventory Management

### Add Item to Character Inventory

```bash
CHARACTER_ID="your-character-id-here"
ITEM_ID="your-item-id-here"

curl -X POST "${BASE_URL}/api/characters/${CHARACTER_ID}/inventory" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "itemId": "'${ITEM_ID}'"
  }'
```

### Get Character Inventory

```bash
CHARACTER_ID="your-character-id-here"

curl -X GET "${BASE_URL}/api/characters/${CHARACTER_ID}/inventory" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

### Remove Item from Character Inventory

```bash
CHARACTER_ID="your-character-id-here"
ITEM_CHARACTER_ID="your-item-character-id-here"

curl -X DELETE "${BASE_URL}/api/characters/${CHARACTER_ID}/inventory/${ITEM_CHARACTER_ID}" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

---

## Paths Management

### Get All Paths

```bash
curl -X GET "${BASE_URL}/api/paths" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

### Get Path by ID

```bash
PATH_ID="your-path-id-here"

curl -X GET "${BASE_URL}/api/paths/${PATH_ID}" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

### Get Available Features For Path

```bash
curl -X GET "${BASE_URL}/api/paths/${PATH_ID}/available-features" \
 -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

---

## Games Management

### Create a Game

```bash
curl -X POST "${BASE_URL}/api/games" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "name": "The Lost Expedition",
    "gameMaster": "YOUR_USER_ID_HERE",
    "imageKey": "lost-expedition.png"
  }'
```

**Note:** Replace `YOUR_USER_ID_HERE` with your actual user ID.

### Get All Games for User

```bash
curl -X GET "${BASE_URL}/api/games" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

### Get Game by ID

```bash
GAME_ID="your-game-id-here"

curl -X GET "${BASE_URL}/api/games/${GAME_ID}" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

---

## Character Level Up

### Level Up Character

```bash
CHARACTER_ID="your-character-id-here"

curl -X POST "${BASE_URL}/api/characters/${CHARACTER_ID}/level-up" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "healthUpdate": {
      "rolledPhysicalHealth": 6,
      "rolledMentalHealth": 10
    },
    "pathId": "692a2e886f6040cf47955002",
    "newFeatureIds": ["692a2e886f6040cf47954fb4", "692a2e886f6040cf47954fcf"],
    "incrementalFeatureIds": [],
    "skillImprovement": "research",
    "attributeChanges": [
      {
        "from": "intelligence.investigation",
        "to": "intelligence.memory"
      }
    ]
  }'
```

### Level Up Character With Incremental Features

```bash
CHARACTER_ID="your-character-id-here"

curl -X POST "${BASE_URL}/api/characters/${CHARACTER_ID}/level-up" \
  -H "Content-Type: application/json" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}" \
  -d '{
    "healthUpdate": {
      "rolledPhysicalHealth": 6,
      "rolledMentalHealth": 10
    },
    "pathId": "692a2e886f6040cf47955002",
    "newFeatureIds": ["692a2e886f6040cf47954ff5"],
    "incrementalFeatureIds": ["692a2e886f6040cf47954fb4"],
    "skillImprovement": "manipulationNegotiation",
    "attributeChanges": [
      {
        "from": "intelligence.investigation",
        "to": "intelligence.memory"
      }
    ]
  }'
```

**Note:**

- `healthUpdate`: New rolled health values (must be between 1 and 10)
- `pathId`: The path to level up in
- `newFeatureIds`: Array of feature IDs to add at grade 1
- `incrementalFeatureIds`: Array of existing feature IDs to increment by 1 grade
- `skillImprovement`: Single skill name to improve (must be a valid general skill)
- `attributeChanges`: Optional array (max 1 item) to swap attribute points between attributes

---

## Available Features for Character

### Get Available Features for Character

```bash
CHARACTER_ID="your-character-id-here"

curl -X GET "${BASE_URL}/api/characters/${CHARACTER_ID}/available-features" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

---

## Image URL Generation

### Get Pre-signed Image URL

```bash
curl -X GET "${BASE_URL}/api/image-url?imageKey=characters/dahlia_ters.png" \
  -H "Cookie: authjs.session-token=${SESSION_COOKIE}"
```

---

## Testing Workflow Example

Here's a suggested workflow for comprehensive testing:

1. **Authenticate** - Get your session cookie
2. **Create Character** - Create a new character with all required fields
3. **Get Character** - Verify the character was created correctly
4. **Create Items** - Create a few items (general item and weapon)
5. **Add Items to Inventory** - Add items to your character's inventory
6. **Get Inventory** - Verify items are in inventory
7. **Update Character** - Update health, wallet, notes, etc.
8. **Get Paths** - Retrieve available paths
9. **Create Game** - Create a game session
10. **Level Up Character** - Test the level-up functionality
11. **Get Available Features** - Check what features are available for your character

---

## Enum Values Reference

### Race

- `KINIAN`
- `HUMAN`
- `FENNE`
- `MANFENN`

### Religion

- `TRITHEOLOGY`
- `PANTRITHEOLOGY`
- `CHRISLAM`
- `HUMANISM`
- `CHOSEN_FAITH`
- `FORE_CAST`
- `ATHEIST`
- `AGNOSTIC`

### Status

- `ALIVE`
- `DECEASED`
- `DERANGED`

### ItemType

- `GENERAL_ITEM`
- `WEAPON`

### ItemWeaponAttackRollType

- `RANGE`
- `MELEE`
- `GRID`
- `THROW`

### ItemWeaponDamageType

- `BULLET`
- `BLADE`
- `SIIKE`
- `ACID`
- `FIRE`
- `ICE`

### PathName

- `SCIENTIST_DOCTOR`
- `SURVIVALIST`
- `ANTIHERO`
- `SOLDIER`
- `CON_ARTIST`
- `SLEUTH`
- `NERD_HERO`
- `TECHNO_CRAFTER`
- `URBAN_ROVER`

---

## Notes

- All protected endpoints require the session cookie in the `Cookie` header
- Replace placeholder IDs (`your-character-id-here`, etc.) with actual IDs from previous responses
- The `userId` field in character creation should match your authenticated user ID
- Attribute values (intelligence, wisdom, etc.) must be between 1 and 5
- Skill values must be between 0 and 5
- Health values are computed automatically, but you can provide `rolledPhysicalHealth` and `rolledMentalHealth`
- Many combat stats are computed automatically from attributes and skills

---

## Troubleshooting

### 401 Unauthorized

- Check that your session cookie is valid and not expired
- Ensure you're including the cookie in the request header
- Try logging in again to get a fresh cookie

### 400 Bad Request

- Verify all required fields are present
- Check that enum values match exactly (case-sensitive)
- Ensure numeric values are within valid ranges
- Check that IDs are valid MongoDB ObjectIds

### 403 Forbidden

- Verify the resource belongs to your user account
- Check that you're using the correct character/item/game ID

### 404 Not Found

- Verify the resource ID exists in the database
- Check that you're using the correct endpoint path
