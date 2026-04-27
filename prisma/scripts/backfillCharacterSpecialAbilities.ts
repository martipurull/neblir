import "dotenv/config";
import { prisma } from "@/app/lib/prisma/client";
import { resolveSpecialAbilityForRace } from "@/app/lib/specialAbility";

async function main() {
  const characters = await prisma.character.findMany({
    select: {
      id: true,
      generalInformation: true,
    },
  });

  let updated = 0;
  for (const character of characters) {
    const specialAbility = resolveSpecialAbilityForRace(
      character.generalInformation.race
    );
    await prisma.character.update({
      where: { id: character.id },
      data: {
        generalInformation: {
          ...character.generalInformation,
          specialAbility,
        },
      },
    });
    updated += 1;
  }

  console.log(
    `Backfilled specialAbility for ${updated} character(s) out of ${characters.length}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
