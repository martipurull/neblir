import fs from "fs";

interface GoogleDocResult {
  name: string;
  id: string;
  document: any;
  fetchedAt: string;
}

interface AllItemDocs {
  fetchedAt: string;
  totalDocuments: number;
  successful: number;
  failed: number;
  results: GoogleDocResult[];
}

interface ParsedItem {
  name: string;
  type: string;
  confCost: string;
  costInfo: string;
  description: string;
  notes: string;
  weight: string;
  usage: string;
  imageKey: string;
  // Weapon fields
  attackRoll: string;
  damageDiceType: string;
  damageNumberOfDice: string;
  damageType: string;
  damagePrimaryRadius: string;
  damageSecondaryRadius: string;
  areaEffectDefenceReactionCost: string;
  areaEffectDefenceRoll: string;
  areaEffectSuccessfulDefenceResult: string;
}

/**
 * Extract text content from a Google Docs paragraph element
 */
function extractTextFromParagraph(paragraph: any): string {
  if (!paragraph.elements) return "";
  
  return paragraph.elements
    .map((elem: any) => {
      if (elem.textRun) {
        return elem.textRun.content || "";
      }
      return "";
    })
    .join("");
}

/**
 * Parse Google Docs structure into a map of sections
 */
function parseDocument(document: any): Map<string, string> {
  const sections = new Map<string, string>();
  const content = document.body?.content || [];
  
  let currentSection = "";
  const sectionContent: string[] = [];
  const preSectionContent: string[] = []; // Content before first heading
  
  for (const item of content) {
    if (item.paragraph) {
      const paragraph = item.paragraph;
      const style = paragraph.paragraphStyle?.namedStyleType;
      const text = extractTextFromParagraph(paragraph).trim();
      
      // Skip empty paragraphs
      if (!text) continue;
      
      // Check if it's a heading
      if (style?.startsWith("HEADING")) {
        // Save previous section
        if (currentSection && sectionContent.length > 0) {
          sections.set(currentSection, sectionContent.join("\n").trim());
        }
        
        // If this is the first heading, save pre-section content as description
        if (!currentSection && preSectionContent.length > 0) {
          const desc = preSectionContent.join("\n").trim();
          if (desc && !sections.has("description")) {
            sections.set("description", desc);
          }
        }
        
        // Start new section
        currentSection = text.toLowerCase().replace(/\n/g, "").trim();
        sectionContent.length = 0;
      } else if (text) {
        // Regular content
        if (currentSection) {
          sectionContent.push(text);
        } else {
          // Content before first heading
          // Skip the title (which is usually HEADING_2)
          if (!style?.startsWith("HEADING")) {
            preSectionContent.push(text);
          }
        }
      }
    }
  }
  
  // Save last section
  if (currentSection && sectionContent.length > 0) {
    sections.set(currentSection, sectionContent.join("\n").trim());
  }
  
  // If no description found and we have pre-section content, use it
  if (!sections.has("description") && preSectionContent.length > 0) {
    const desc = preSectionContent.join("\n").trim();
    if (desc) {
      sections.set("description", desc);
    }
  }
  
  return sections;
}

/**
 * Extract cost number from cost text
 */
function extractCost(text: string): { cost: number; info: string } {
  if (!text) return { cost: 0, info: "" };
  
  // Remove commas from numbers (e.g., "9,500" -> "9500")
  const normalizedText = text.replace(/,/g, "");
  
  // Try to find numbers followed by CONF
  const match = normalizedText.match(/(\d+)\s*CONF/i);
  if (match) {
    const cost = parseInt(match[1], 10);
    const info = text.replace(match[0], "").trim();
    return { cost, info: info || text };
  }
  
  // Try to find just a number (first occurrence)
  const numberMatch = normalizedText.match(/(\d+)/);
  if (numberMatch) {
    return { cost: parseInt(numberMatch[1], 10), info: text };
  }
  
  return { cost: 0, info: text };
}

/**
 * Parse attack roll types
 */
function parseAttackRoll(text: string, itemName: string = ""): string[] {
  if (!text) return [];
  
  const types: string[] = [];
  const upper = text.toUpperCase();
  
  // Check for explicit mentions (be careful with "THROW" - it might be in the item name like "Flame Thrower")
  // Look for whole word matches or context that suggests attack type
  const throwWordRegex = /\bTHROW(?:N|S)?\b/;
  const hasThrowInName = itemName.toUpperCase().includes("THROW");
  
  if (upper.includes("RANGE") || upper.includes("RANGED") || upper.includes("RANGED ATTACK")) types.push("RANGE");
  if (upper.includes("MELEE") || upper.includes("MELEE ATTACK")) types.push("MELEE");
  if (upper.includes("GRID") || upper.includes("GRID ATTACK")) types.push("GRID");
  if ((throwWordRegex.test(upper) || upper.includes("THROWN")) && !hasThrowInName) types.push("THROW");
  
  // If no explicit type found, try to infer from context
  if (types.length === 0) {
    if (upper.includes("SHOOT") || upper.includes("AIM") || upper.includes("FIRE") || upper.includes("TARGET") || upper.includes("TRIGGER") || upper.includes("GUN") || upper.includes("RIFLE")) {
      types.push("RANGE");
    } else if (upper.includes("SWING") || upper.includes("STRIKE") || upper.includes("HIT") || upper.includes("SWORD") || upper.includes("BLADE") || upper.includes("CLUB") || upper.includes("HAMMER")) {
      types.push("MELEE");
    } else if (upper.includes("CONE") || upper.includes("AREA")) {
      // Area effects are often ranged
      types.push("RANGE");
    }
  }
  
  return types.length > 0 ? types : []; // Don't default - let user review
}

/**
 * Parse damage information
 */
function parseDamage(text: string): {
  diceType?: number;
  numberOfDice?: number;
  damageType?: string;
  primaryRadius?: number;
  secondaryRadius?: number;
} {
  if (!text) return {};
  
  const result: any = {};
  
  // Parse dice notation like "5d6" or "2d10" or "5d6 per shot"
  const diceMatch = text.match(/(\d+)d(\d+)/i);
  if (diceMatch) {
    result.numberOfDice = parseInt(diceMatch[1], 10);
    result.diceType = parseInt(diceMatch[2], 10);
  }
  
  // Parse damage type
  const upper = text.toUpperCase();
  if (upper.includes("BULLET")) result.damageType = "BULLET";
  else if (upper.includes("BLADE") || upper.includes("CUTTING")) result.damageType = "BLADE";
  else if (upper.includes("SIIKE")) result.damageType = "SIIKE";
  else if (upper.includes("ACID")) result.damageType = "ACID";
  else if (upper.includes("FIRE") || upper.includes("FLAME") || upper.includes("BURN")) result.damageType = "FIRE";
  else if (upper.includes("ICE") || upper.includes("FREEZE") || upper.includes("COLD")) result.damageType = "ICE";
  
  // Parse radius (e.g., "15m", "20 metres", "15m cone")
  const radiusMatch = text.match(/(\d+)\s*m(?:\s|$|,|\.)/i);
  if (radiusMatch) {
    result.primaryRadius = parseInt(radiusMatch[1], 10);
    
    // Try to find secondary radius (e.g., "15m cone (half damage up to 20m)")
    const secondaryMatch = text.match(/(?:half|secondary|up to|up to)\s*(?:damage|distance)?\s*(?:up to|at)?\s*(\d+)\s*m/i);
    if (secondaryMatch) {
      result.secondaryRadius = parseInt(secondaryMatch[1], 10);
    }
  }
  
  return result;
}

/**
 * Determine item type based on content
 */
function determineType(sections: Map<string, string>): "GENERAL_ITEM" | "WEAPON" {
  // Check if it has weapon-specific sections
  const hasAttackRoll = sections.has("attack roll") || sections.has("attackroll");
  const hasDamage = sections.has("damage");
  
  if (hasAttackRoll || hasDamage) {
    return "WEAPON";
  }
  
  return "GENERAL_ITEM";
}

/**
 * Parse a single item document
 */
function parseItem(result: GoogleDocResult): ParsedItem {
  const sections = parseDocument(result.document);
  const itemName = result.name || result.document.title || "Unknown";
  
  const item: ParsedItem = {
    name: itemName,
    type: "",
    confCost: "",
    costInfo: "",
    description: "",
    notes: "",
    weight: "",
    usage: "",
    imageKey: "",
    attackRoll: "",
    damageDiceType: "",
    damageNumberOfDice: "",
    damageType: "",
    damagePrimaryRadius: "",
    damageSecondaryRadius: "",
    areaEffectDefenceReactionCost: "",
    areaEffectDefenceRoll: "",
    areaEffectSuccessfulDefenceResult: "",
  };
  
  // Determine type
  item.type = determineType(sections);
  
  // Extract cost
  const costSection = sections.get("cost") || "";
  if (costSection) {
    const { cost, info } = extractCost(costSection);
    item.confCost = cost.toString();
    item.costInfo = info;
  }
  
  // Extract description - check various possible section names
  item.description = 
    sections.get("description") || 
    sections.get("desc") || 
    ""; // If no explicit description, might need manual review
  
  // If still no description, check if there's content in other common sections that could be description
  if (!item.description) {
    // Sometimes the first text content after title is description
    const usageText = sections.get("usage");
    if (usageText && item.type === "GENERAL_ITEM") {
      // For general items, usage might contain descriptive text
    }
  }
  
  // Extract notes
  item.notes = sections.get("notes") || "";
  
  // Extract weight
  const weightText = sections.get("weight") || "";
  if (weightText) {
    const weightMatch = weightText.match(/(\d+)/);
    if (weightMatch) {
      item.weight = weightMatch[1];
    }
  }
  
  // Extract usage (for general items)
  item.usage = sections.get("usage") || "";
  
  // Extract weapon-specific fields
  if (item.type === "WEAPON") {
    const attackRollText = sections.get("attack roll") || sections.get("attackroll") || "";
    const attackRollTypes = parseAttackRoll(attackRollText, itemName);
    item.attackRoll = attackRollTypes.length > 0 ? JSON.stringify(attackRollTypes) : "";
    
    const damageText = sections.get("damage") || "";
    const damage = parseDamage(damageText);
    if (damage.numberOfDice) item.damageNumberOfDice = damage.numberOfDice.toString();
    if (damage.diceType) item.damageDiceType = damage.diceType.toString();
    if (damage.damageType) item.damageType = damage.damageType;
    if (damage.primaryRadius) item.damagePrimaryRadius = damage.primaryRadius.toString();
    if (damage.secondaryRadius) item.damageSecondaryRadius = damage.secondaryRadius.toString();
    
    // Try to extract area effect from notes or description
    const areaEffectText = item.notes || item.description;
    if (areaEffectText.toLowerCase().includes("area")) {
      // This would need more sophisticated parsing
      // For now, leave empty
    }
  }
  
  return item;
}

async function main() {
  const inputFile = process.argv[2] || "./all-item-docs.json";
  const outputFile = process.argv[3] || "./items-extracted.csv";
  
  console.log(`Reading from: ${inputFile}`);
  
  if (!fs.existsSync(inputFile)) {
    throw new Error(`Input file not found: ${inputFile}`);
  }
  
  const data: AllItemDocs = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  console.log(`Found ${data.results.length} items to process`);
  
  const parsedItems: ParsedItem[] = [];
  
  for (let i = 0; i < data.results.length; i++) {
    const result = data.results[i];
    console.log(`[${i + 1}/${data.results.length}] Processing: ${result.name}`);
    
    try {
      const item = parseItem(result);
      parsedItems.push(item);
    } catch (error: any) {
      console.error(`  ✗ Error parsing ${result.name}: ${error.message}`);
    }
  }
  
  // Define CSV columns based on schema
  const columns = [
    "name",
    "type",
    "confCost",
    "costInfo",
    "description",
    "notes",
    "weight",
    "usage",
    "imageKey",
    "attackRoll",
    "damageDiceType",
    "damageNumberOfDice",
    "damageType",
    "damagePrimaryRadius",
    "damageSecondaryRadius",
    "areaEffectDefenceReactionCost",
    "areaEffectDefenceRoll",
    "areaEffectSuccessfulDefenceResult",
  ];
  
  // Convert to CSV
  const escapeCSV = (value: string | undefined | null): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    // If contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  // Write CSV header
  const csvLines = [columns.map(escapeCSV).join(",")];
  
  // Write CSV rows
  for (const item of parsedItems) {
    const row = columns.map(col => escapeCSV(item[col as keyof ParsedItem]));
    csvLines.push(row.join(","));
  }
  
  fs.writeFileSync(outputFile, csvLines.join("\n"));
  console.log(`\n✓ Successfully extracted ${parsedItems.length} items to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

