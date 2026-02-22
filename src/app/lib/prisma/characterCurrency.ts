import { Currency } from "../types/item";
import { prisma } from "./client";

export async function getCharacterWallet(characterId: string) {
  return prisma.characterCurrency.findMany({
    where: { characterId },
  });
}

export async function replaceCharacterWallet(
  characterId: string,
  wallet: Currency[]
) {
  return prisma.$transaction(async (tx) => {
    await tx.characterCurrency.deleteMany({
      where: { characterId },
    });

    if (wallet.length === 0) {
      return [];
    }

    await tx.characterCurrency.createMany({
      data: wallet.map((entry) => ({
        characterId,
        currencyName: entry.currencyName,
        quantity: entry.quantity,
      })),
    });

    return tx.characterCurrency.findMany({
      where: { characterId },
    });
  });
}

export async function deleteCharacterWallet(characterId: string) {
  return prisma.characterCurrency.deleteMany({
    where: { characterId },
  });
}

export async function addCharacterCurrency(
  characterId: string,
  currencyName: Currency["currencyName"],
  amount: number
) {
  return prisma.$transaction(async (tx) => {
    await tx.characterCurrency.upsert({
      where: {
        characterId_currencyName: {
          characterId,
          currencyName,
        },
      },
      create: {
        characterId,
        currencyName,
        quantity: amount,
      },
      update: {
        quantity: {
          increment: amount,
        },
      },
    });

    return tx.characterCurrency.findMany({
      where: { characterId },
    });
  });
}

export async function subtractCharacterCurrency(
  characterId: string,
  currencyName: Currency["currencyName"],
  amount: number
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.characterCurrency.findUnique({
      where: {
        characterId_currencyName: {
          characterId,
          currencyName,
        },
      },
    });

    if (!existing) {
      throw new Error("CURRENCY_NOT_FOUND");
    }

    if (existing.quantity < amount) {
      throw new Error("INSUFFICIENT_FUNDS");
    }

    const newQuantity = existing.quantity - amount;
    if (newQuantity === 0) {
      await tx.characterCurrency.delete({
        where: {
          characterId_currencyName: {
            characterId,
            currencyName,
          },
        },
      });
    } else {
      await tx.characterCurrency.update({
        where: {
          characterId_currencyName: {
            characterId,
            currencyName,
          },
        },
        data: {
          quantity: {
            decrement: amount,
          },
        },
      });
    }

    return tx.characterCurrency.findMany({
      where: { characterId },
    });
  });
}
