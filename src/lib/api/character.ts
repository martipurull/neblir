import {
  characterDetailSchema,
  type CharacterDetail,
} from "@/app/lib/types/character";

type ApiErrorPayload = {
  message?: string;
  details?: string;
};

export async function getCharacterById(
  id: string,
  signal?: AbortSignal
): Promise<CharacterDetail> {
  const response = await fetch(`/api/characters/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal,
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch character";
    try {
      const errorPayload = (await response.json()) as ApiErrorPayload;
      errorMessage =
        errorPayload.details || errorPayload.message || errorMessage;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage);
  }

  const json = await response.json();
  const parsed = characterDetailSchema.safeParse(json);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(
      `Character response did not match expected shape: ${details}`
    );
  }
  return parsed.data;
}
