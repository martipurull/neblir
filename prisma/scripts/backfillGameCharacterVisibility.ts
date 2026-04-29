import "dotenv/config";
import { prisma } from "@/app/lib/prisma/client";

async function main() {
  const result = await prisma.gameCharacter.updateMany({
    where: {},
    data: { isPublic: true },
  });

  console.log(`Set isPublic=true for ${result.count} GameCharacter row(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
