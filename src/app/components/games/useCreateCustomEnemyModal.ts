import { useItemImageUpload } from "@/app/components/games/shared/useItemImageUpload";
import { enemyActionSchema } from "@/app/lib/types/enemy";
import { weaponDamageTypeSchema } from "@/app/lib/types/item";
import {
  getUserSafeApiError,
  getUserSafeErrorMessage,
} from "@/lib/userSafeError";
import type { ItemWeaponDamageType } from "@prisma/client";
import type { z } from "zod";
import { useCallback, useEffect, useState } from "react";

export type CustomEnemyActionDraft = {
  clientId: string;
  name: string;
  description: string;
  numberOfDiceToHit: string;
  numberOfDamageDice: string;
  damageDiceType: string;
  damageType: string;
  notes: string;
};

type Args = {
  gameId: string;
  isOpen: boolean;
  editCustomEnemyId: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

function newClientId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyActionDraft(): CustomEnemyActionDraft {
  return {
    clientId: newClientId(),
    name: "",
    description: "",
    numberOfDiceToHit: "",
    numberOfDamageDice: "",
    damageDiceType: "",
    damageType: "",
    notes: "",
  };
}

function apiActionToDraft(raw: unknown): CustomEnemyActionDraft {
  const o = raw as Record<string, unknown>;
  return {
    clientId: newClientId(),
    name: String(o.name ?? ""),
    description: typeof o.description === "string" ? o.description : "",
    numberOfDiceToHit:
      typeof o.numberOfDiceToHit === "number"
        ? String(o.numberOfDiceToHit)
        : "",
    numberOfDamageDice:
      typeof o.numberOfDamageDice === "number"
        ? String(o.numberOfDamageDice)
        : "",
    damageDiceType:
      typeof o.damageDiceType === "number" ? String(o.damageDiceType) : "",
    damageType: typeof o.damageType === "string" ? o.damageType : "",
    notes: typeof o.notes === "string" ? o.notes : "",
  };
}

function parseActionDrafts(
  rows: CustomEnemyActionDraft[],
  listLabel: string
): z.infer<typeof enemyActionSchema>[] {
  const out: z.infer<typeof enemyActionSchema>[] = [];
  for (const row of rows) {
    const name = row.name.trim();
    if (!name) continue;
    const obj: Record<string, unknown> = { name };
    if (row.description.trim()) obj.description = row.description.trim();
    if (row.notes.trim()) obj.notes = row.notes.trim();
    const toHit = row.numberOfDiceToHit.trim();
    if (toHit) {
      const n = Number.parseInt(toHit, 10);
      if (Number.isNaN(n) || n < 1) {
        throw new Error(
          `${listLabel}: "${name}" — # d10 to hit must be a positive whole number or blank.`
        );
      }
      obj.numberOfDiceToHit = n;
    }
    const numberOfDamageDice = row.numberOfDamageDice.trim();
    if (numberOfDamageDice) {
      const n = Number.parseInt(numberOfDamageDice, 10);
      if (Number.isNaN(n) || n < 1) {
        throw new Error(
          `${listLabel}: "${name}" — # damage dice must be a positive whole number or blank.`
        );
      }
      obj.numberOfDamageDice = n;
    }
    const damageDiceType = row.damageDiceType.trim();
    if (damageDiceType) {
      const n = Number.parseInt(damageDiceType, 10);
      if (Number.isNaN(n) || n < 1) {
        throw new Error(
          `${listLabel}: "${name}" — damage die size must be a positive whole number or blank.`
        );
      }
      obj.damageDiceType = n;
    }
    const dmg = row.damageType.trim();
    if (dmg) {
      const parsedDmg = weaponDamageTypeSchema.safeParse(dmg);
      if (!parsedDmg.success) {
        throw new Error(`${listLabel}: "${name}" — invalid damage type.`);
      }
      obj.damageType = parsedDmg.data;
    }
    const parsed = enemyActionSchema.safeParse(obj);
    if (!parsed.success) {
      throw new Error(
        `${listLabel}: "${name}" — ${parsed.error.issues.map((i) => i.message).join("; ")}`
      );
    }
    out.push(parsed.data);
  }
  return out;
}

function parseDamageList(raw: unknown): ItemWeaponDamageType[] {
  if (!Array.isArray(raw)) return [];
  const out: ItemWeaponDamageType[] = [];
  for (const x of raw) {
    const p = weaponDamageTypeSchema.safeParse(x);
    if (p.success) out.push(p.data);
  }
  return out;
}

function optionalIntBody(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n))
    throw new Error("Use a whole number or leave blank for 0.");
  return n;
}

function requiredInt(value: string, field: string): number {
  const parsed = Number.parseInt(value, 10);
  if (value.trim() === "" || Number.isNaN(parsed)) {
    throw new Error(`${field} is required and must be a whole number.`);
  }
  return parsed;
}

export function useCreateCustomEnemyModal({
  gameId,
  isOpen,
  editCustomEnemyId,
  onClose,
  onSuccess,
}: Args) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const [immunities, setImmunities] = useState<ItemWeaponDamageType[]>([]);
  const [resistances, setResistances] = useState<ItemWeaponDamageType[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<
    ItemWeaponDamageType[]
  >([]);
  const [health, setHealth] = useState("");
  const [speed, setSpeed] = useState("");
  const [initiativeModifier, setInitiativeModifier] = useState("");
  const [numberOfReactions, setNumberOfReactions] = useState("");
  const [defenceMelee, setDefenceMelee] = useState("");
  const [defenceRange, setDefenceRange] = useState("");
  const [defenceGrid, setDefenceGrid] = useState("");
  const [attackMelee, setAttackMelee] = useState("");
  const [attackRange, setAttackRange] = useState("");
  const [attackThrow, setAttackThrow] = useState("");
  const [attackGrid, setAttackGrid] = useState("");
  const [actions, setActions] = useState<CustomEnemyActionDraft[]>([]);
  const [additionalActions, setAdditionalActions] = useState<
    CustomEnemyActionDraft[]
  >([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageUpload = useItemImageUpload("custom_enemies");
  const {
    imageKey,
    pendingImageKey,
    setImageKey,
    setPendingImageKey,
    deleteUploadedImage,
    handleFile,
    handleDrop,
    handleDragOver,
    reset: resetImageUpload,
  } = imageUpload;

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setNotes("");
    setHealth("");
    setSpeed("");
    setInitiativeModifier("");
    setNumberOfReactions("");
    setDefenceMelee("");
    setDefenceRange("");
    setDefenceGrid("");
    setAttackMelee("");
    setAttackRange("");
    setAttackThrow("");
    setAttackGrid("");
    setActions([]);
    setAdditionalActions([]);
    setImmunities([]);
    setResistances([]);
    setVulnerabilities([]);
    resetImageUpload();
    setError(null);
    setLoadingEdit(false);
    setRichTextSyncKey((k) => k + 1);
  }, [resetImageUpload]);

  const toggleImmunity = useCallback((t: ItemWeaponDamageType) => {
    setImmunities((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);

  const toggleResistance = useCallback((t: ItemWeaponDamageType) => {
    setResistances((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);

  const toggleVulnerability = useCallback((t: ItemWeaponDamageType) => {
    setVulnerabilities((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
  }, []);

  const addActionRow = useCallback((which: "actions" | "additionalActions") => {
    const row = emptyActionDraft();
    if (which === "actions") setActions((prev) => [...prev, row]);
    else setAdditionalActions((prev) => [...prev, row]);
  }, []);

  const removeActionRow = useCallback(
    (which: "actions" | "additionalActions", clientId: string) => {
      const drop = (prev: CustomEnemyActionDraft[]) =>
        prev.filter((r) => r.clientId !== clientId);
      if (which === "actions") setActions(drop);
      else setAdditionalActions(drop);
    },
    []
  );

  const updateActionField = useCallback(
    (
      which: "actions" | "additionalActions",
      clientId: string,
      field: Exclude<keyof CustomEnemyActionDraft, "clientId">,
      value: string
    ) => {
      const patch = (prev: CustomEnemyActionDraft[]) =>
        prev.map((r) =>
          r.clientId === clientId ? { ...r, [field]: value } : r
        );
      if (which === "actions") setActions(patch);
      else setAdditionalActions(patch);
    },
    []
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!editCustomEnemyId) {
      resetForm();
      return;
    }
    let cancelled = false;
    setLoadingEdit(true);
    setError(null);
    setActions([]);
    setAdditionalActions([]);
    resetImageUpload();
    void (async () => {
      try {
        const res = await fetch(
          `/api/games/${encodeURIComponent(gameId)}/custom-enemies/${encodeURIComponent(editCustomEnemyId)}`,
          { method: "GET" }
        );
        const data = (await res.json()) as Record<string, unknown>;
        if (!res.ok || cancelled) {
          if (!cancelled) {
            setError(
              getUserSafeApiError(
                res.status,
                data as { message?: string; details?: string },
                "Failed to load enemy."
              )
            );
          }
          return;
        }
        setName(String(data.name ?? ""));
        setDescription(String(data.description ?? ""));
        setNotes(String(data.notes ?? ""));
        setHealth(String(data.health ?? ""));
        setSpeed(String(data.speed ?? ""));
        setInitiativeModifier(String(data.initiativeModifier ?? ""));
        setNumberOfReactions(String(data.numberOfReactions ?? ""));
        setDefenceMelee(String(data.defenceMelee ?? ""));
        setDefenceRange(String(data.defenceRange ?? ""));
        setDefenceGrid(String(data.defenceGrid ?? ""));
        setAttackMelee(String(data.attackMelee ?? ""));
        setAttackRange(String(data.attackRange ?? ""));
        setAttackThrow(String(data.attackThrow ?? ""));
        setAttackGrid(String(data.attackGrid ?? ""));
        setActions(
          Array.isArray(data.actions)
            ? (data.actions as unknown[]).map(apiActionToDraft)
            : []
        );
        setAdditionalActions(
          Array.isArray(data.additionalActions)
            ? (data.additionalActions as unknown[]).map(apiActionToDraft)
            : []
        );
        setImmunities(parseDamageList(data.immunities));
        setResistances(parseDamageList(data.resistances));
        setVulnerabilities(parseDamageList(data.vulnerabilities));
        if (typeof data.imageKey === "string" && data.imageKey) {
          setImageKey(data.imageKey);
        }
        setRichTextSyncKey((k) => k + 1);
      } catch (e) {
        if (!cancelled) {
          setError(getUserSafeErrorMessage(e, "Failed to load enemy."));
        }
      } finally {
        if (!cancelled) setLoadingEdit(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    editCustomEnemyId,
    gameId,
    isOpen,
    resetForm,
    resetImageUpload,
    setImageKey,
  ]);

  const buildBody = useCallback((): Record<string, unknown> => {
    const parsedActions = parseActionDrafts(actions, "Actions");
    const parsedAdditional = parseActionDrafts(
      additionalActions,
      "Additional actions"
    );
    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description || undefined,
      notes: notes || undefined,
      health: requiredInt(health, "Health"),
      speed: requiredInt(speed, "Speed"),
      initiativeModifier: requiredInt(
        initiativeModifier,
        "Initiative modifier"
      ),
      numberOfReactions: requiredInt(numberOfReactions, "Number of reactions"),
      immunities,
      resistances,
      vulnerabilities,
      actions: parsedActions,
      additionalActions: parsedAdditional,
    };
    const dm = optionalIntBody(defenceMelee);
    const dr = optionalIntBody(defenceRange);
    const dg = optionalIntBody(defenceGrid);
    const am = optionalIntBody(attackMelee);
    const ar = optionalIntBody(attackRange);
    const at = optionalIntBody(attackThrow);
    const ag = optionalIntBody(attackGrid);
    if (dm !== undefined) body.defenceMelee = dm;
    if (dr !== undefined) body.defenceRange = dr;
    if (dg !== undefined) body.defenceGrid = dg;
    if (am !== undefined) body.attackMelee = am;
    if (ar !== undefined) body.attackRange = ar;
    if (at !== undefined) body.attackThrow = at;
    if (ag !== undefined) body.attackGrid = ag;
    if (imageKey) body.imageKey = imageKey;
    return body;
  }, [
    actions,
    additionalActions,
    attackGrid,
    attackMelee,
    attackRange,
    attackThrow,
    defenceGrid,
    defenceMelee,
    defenceRange,
    description,
    health,
    imageKey,
    immunities,
    initiativeModifier,
    numberOfReactions,
    name,
    notes,
    resistances,
    speed,
    vulnerabilities,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    let body: Record<string, unknown>;
    try {
      body = buildBody();
    } catch (parseError) {
      setError(
        parseError instanceof Error
          ? parseError.message
          : "Check numeric fields."
      );
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = Boolean(editCustomEnemyId);
      const url = isEdit
        ? `/api/games/${encodeURIComponent(gameId)}/custom-enemies/${encodeURIComponent(editCustomEnemyId!)}`
        : `/api/games/${encodeURIComponent(gameId)}/custom-enemies`;
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (pendingImageKey) {
          await deleteUploadedImage(pendingImageKey);
          setPendingImageKey("");
        }
        setError(
          getUserSafeApiError(
            response.status,
            data as { message?: string; details?: string },
            isEdit
              ? "Failed to update custom enemy."
              : "Failed to create custom enemy."
          )
        );
        return;
      }
      setPendingImageKey("");
      onSuccess?.();
      void handleClose(true);
    } catch (submitError) {
      if (pendingImageKey) {
        await deleteUploadedImage(pendingImageKey);
        setPendingImageKey("");
      }
      setError(
        getUserSafeErrorMessage(
          submitError,
          editCustomEnemyId
            ? "Failed to update custom enemy."
            : "Failed to create custom enemy."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async (skipCleanup?: boolean) => {
    if (!skipCleanup && pendingImageKey) {
      await deleteUploadedImage(pendingImageKey);
    }
    resetForm();
    onClose();
  };

  return {
    name,
    setName,
    description,
    setDescription,
    notes,
    setNotes,
    richTextSyncKey,
    immunities,
    resistances,
    vulnerabilities,
    toggleImmunity,
    toggleResistance,
    toggleVulnerability,
    health,
    setHealth,
    speed,
    setSpeed,
    initiativeModifier,
    setInitiativeModifier,
    numberOfReactions,
    setNumberOfReactions,
    defenceMelee,
    setDefenceMelee,
    defenceRange,
    setDefenceRange,
    defenceGrid,
    setDefenceGrid,
    attackMelee,
    setAttackMelee,
    attackRange,
    setAttackRange,
    attackThrow,
    setAttackThrow,
    attackGrid,
    setAttackGrid,
    actions,
    additionalActions,
    addActionRow,
    removeActionRow,
    updateActionField,
    imageUpload,
    imageKey,
    handleFile,
    handleDrop,
    handleDragOver,
    submitting: submitting || loadingEdit,
    loadingEdit,
    error,
    handleSubmit,
    handleClose,
    isEdit: Boolean(editCustomEnemyId),
  };
}
