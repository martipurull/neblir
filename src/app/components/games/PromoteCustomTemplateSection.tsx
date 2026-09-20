"use client";

import { GameModalRichTextField } from "@/app/components/games/shared/GameModalRichTextField";
import { ModalNumberField } from "@/app/components/games/shared/ModalNumberField";
import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { ModalShell } from "@/app/components/shared/ModalShell";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { TextField } from "@/app/components/shared/TextField";
import { DAMAGE_TYPES } from "@/app/lib/constants/itemCatalogue";
import { serializeEditorToStoredHtml } from "@/app/lib/tiptap/richText";
import { richTextToPlainTextPreview } from "@/app/lib/tiptap/richTextPlainTextPreview";
import type { PromotableCatalogueDomain } from "@/app/lib/types/cataloguePromotion";
import { itemDamageSchema, type ItemDamage } from "@/app/lib/types/item";
import { normalizeItemBrowseDamage } from "@/app/lib/types/itemBrowseDetail";
import { useUser } from "@/hooks/use-user";
import { useGame } from "@/hooks/use-game";
import {
  promoteCustomTemplate,
  type CataloguePromotionSuccess,
} from "@/lib/api/cataloguePromotions";
import { getCustomEnemy } from "@/lib/api/customEnemies";
import { getGameCustomItemRecord } from "@/lib/api/customItems";
import { getGameCustomVehicleRecord } from "@/lib/api/customVehicles";
import { getUserSafeErrorMessage } from "@/lib/userSafeError";
import Link from "next/link";
import { useState } from "react";

type MissingOfficialRequireds = {
  confCost: boolean;
  description: boolean;
  usage: boolean;
  damage: boolean;
};

const ACCESS_OPTIONS = [
  { value: "PLAYER", label: "Player" },
  { value: "GAME_MASTER", label: "Game master" },
];

function isBlankRequiredText(value: unknown): boolean {
  if (typeof value !== "string") return true;
  return richTextToPlainTextPreview(value) == null;
}

async function loadMissingOfficialRequireds(
  gameId: string,
  customId: string,
  catalogueDomain: PromotableCatalogueDomain
): Promise<MissingOfficialRequireds> {
  if (catalogueDomain === "items") {
    const item = await getGameCustomItemRecord(gameId, customId);
    return {
      confCost: typeof item.confCost !== "number",
      description: isBlankRequiredText(item.description),
      usage: item.type === "GENERAL_ITEM" && isBlankRequiredText(item.usage),
      damage:
        item.type === "WEAPON" &&
        normalizeItemBrowseDamage(item.damage) == null,
    };
  }
  if (catalogueDomain === "vehicles") {
    const vehicle = await getGameCustomVehicleRecord(gameId, customId);
    return {
      confCost: typeof vehicle.confCost !== "number",
      description: isBlankRequiredText(vehicle.description),
      usage: false,
      damage: false,
    };
  }
  await getCustomEnemy(gameId, customId);
  return { confCost: false, description: false, usage: false, damage: false };
}

function buildPromoteDamage(
  damageTypes: string[],
  damageDiceType: string,
  damageNumberOfDice: string
): ItemDamage | null {
  const diceType = Number.parseInt(damageDiceType.trim(), 10);
  const numberOfDice = Number.parseInt(damageNumberOfDice.trim(), 10);
  const parsed = itemDamageSchema.safeParse({
    damageType: damageTypes,
    diceType,
    numberOfDice,
  });
  return parsed.success ? parsed.data : null;
}

function catalogueDomainLabel(
  catalogueDomain: PromotableCatalogueDomain
): string {
  if (catalogueDomain === "items") return "item";
  if (catalogueDomain === "vehicles") return "vehicle";
  return "enemy";
}

type PromoteCustomTemplateSectionProps = {
  gameId: string;
  customId: string;
  catalogueDomain: PromotableCatalogueDomain;
  disabled?: boolean;
  onPromoted?: (result: CataloguePromotionSuccess) => void;
};

export function PromoteCustomTemplateSection({
  gameId,
  customId,
  catalogueDomain,
  disabled = false,
  onPromoted,
}: PromoteCustomTemplateSectionProps) {
  const { user } = useUser();
  const { game } = useGame(gameId);
  const [formOpen, setFormOpen] = useState(false);
  const [opening, setOpening] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<MissingOfficialRequireds>({
    confCost: false,
    description: false,
    usage: false,
    damage: false,
  });
  const [accessType, setAccessType] = useState<"PLAYER" | "GAME_MASTER">(
    "PLAYER"
  );
  const [confCost, setConfCost] = useState("");
  const [description, setDescription] = useState("");
  const [usage, setUsage] = useState("");
  const [damageTypes, setDamageTypes] = useState<string[]>([]);
  const [damageDiceType, setDamageDiceType] = useState("");
  const [damageNumberOfDice, setDamageNumberOfDice] = useState("");
  const [richTextSyncKey, setRichTextSyncKey] = useState(0);
  const [success, setSuccess] = useState<CataloguePromotionSuccess | null>(
    null
  );

  if (!user?.isSuperAdmin || !game?.isGameMaster) return null;

  const needsAccessType = catalogueDomain !== "enemies";

  const openForm = async () => {
    setError(null);
    setSuccess(null);
    setOpening(true);
    try {
      const nextMissing = await loadMissingOfficialRequireds(
        gameId,
        customId,
        catalogueDomain
      );
      setMissing(nextMissing);
      setAccessType("PLAYER");
      setConfCost("");
      setDescription("");
      setUsage("");
      setDamageTypes([]);
      setDamageDiceType("");
      setDamageNumberOfDice("");
      setRichTextSyncKey((key) => key + 1);
      setFormOpen(true);
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "Failed to load Custom template"));
    } finally {
      setOpening(false);
    }
  };

  const closeForm = () => {
    if (submitting) return;
    setFormOpen(false);
  };

  const confCostNumber = Number.parseInt(confCost.trim(), 10);
  const descriptionStored = serializeEditorToStoredHtml(description);
  const promoteDamage = missing.damage
    ? buildPromoteDamage(damageTypes, damageDiceType, damageNumberOfDice)
    : null;
  const missingRequiredsUnfilled =
    (missing.confCost && !Number.isFinite(confCostNumber)) ||
    (missing.description && descriptionStored === "") ||
    (missing.usage && usage.trim() === "") ||
    (missing.damage && promoteDamage == null);

  const handlePromote = async () => {
    if (missingRequiredsUnfilled) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await promoteCustomTemplate(gameId, {
        catalogueDomain,
        customId,
        ...(needsAccessType ? { accessType } : {}),
        ...(missing.confCost ? { confCost: confCostNumber } : {}),
        ...(missing.description ? { description: descriptionStored } : {}),
        ...(missing.usage ? { usage: usage.trim() } : {}),
        ...(missing.damage && promoteDamage ? { damage: promoteDamage } : {}),
      });
      setSuccess(result);
      onPromoted?.(result);
    } catch (err) {
      setError(getUserSafeErrorMessage(err, "Failed to promote"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="border-t border-white/10 pt-4">
        {error && !formOpen ? (
          <p className="mb-3 text-sm text-neblirDanger-400">{error}</p>
        ) : null}
        <Button
          type="button"
          variant="semanticSafeOutline"
          fullWidth={false}
          disabled={disabled || opening || submitting}
          onClick={() => {
            void openForm();
          }}
        >
          {opening ? "Loading…" : "Promote to Official"}
        </Button>
      </div>

      <ModalShell
        isOpen={formOpen}
        onClose={closeForm}
        title={`Promote Custom ${catalogueDomainLabel(catalogueDomain)}`}
        titleId="promote-custom-template-title"
        subtitle="Creates a new Official catalogue row. The Custom template and its holdings stay as they are."
        zIndexClass="z-[60]"
        closeDisabled={submitting}
        closeOnBackdrop={!submitting}
        footer={
          success ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="modalFooterPrimary"
                fullWidth={false}
                onClick={closeForm}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="modalFooterSecondary"
                fullWidth={false}
                onClick={closeForm}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="modalFooterPrimary"
                fullWidth={false}
                onClick={() => {
                  void handlePromote();
                }}
                disabled={submitting || missingRequiredsUnfilled}
              >
                {submitting ? "Promoting…" : "Promote"}
              </Button>
            </div>
          )
        }
      >
        {success ? (
          <p className="text-sm text-neblirSafe-400">
            Promoted “{success.name}” to Official.{" "}
            <Link
              href={success.editHref}
              className="font-semibold text-paleBlue underline underline-offset-2"
            >
              Edit Official {success.catalogueDomain}
            </Link>
          </p>
        ) : (
          <div className="space-y-4">
            {needsAccessType ? (
              <RadioGroup
                name="promote-access-type"
                label="Access"
                value={accessType}
                onChange={(value) =>
                  setAccessType(value as "PLAYER" | "GAME_MASTER")
                }
                options={ACCESS_OPTIONS}
                tone="inverse"
                disabled={submitting}
              />
            ) : (
              <p className="text-sm text-white/80">
                This Custom enemy already has Official-shaped fields. Promote
                copies it into the catalogue with a new id.
              </p>
            )}
            {missing.confCost ? (
              <ModalNumberField
                id="promote-conf-cost"
                label="Conf cost"
                value={confCost}
                onChange={setConfCost}
                disabled={submitting}
                min={0}
                placeholder="0"
              />
            ) : null}
            {missing.description ? (
              <GameModalRichTextField
                id="promote-description"
                label="Description"
                value={description}
                onChange={setDescription}
                disabled={submitting}
                required
                syncKey={richTextSyncKey}
              />
            ) : null}
            {missing.usage ? (
              <div>
                <FieldLabel id="promote-usage" label="Usage" required />
                <TextField
                  id="promote-usage"
                  variant="dark"
                  value={usage}
                  onChange={(event) => setUsage(event.target.value)}
                  disabled={submitting}
                  placeholder="How this item is used"
                />
              </div>
            ) : null}
            {missing.damage ? (
              <div className="space-y-3">
                <div>
                  <FieldLabel
                    id="promote-damage-types"
                    label="Damage types"
                    required
                  />
                  <div className="flex flex-wrap gap-2">
                    {DAMAGE_TYPES.map((damageType) => (
                      <Checkbox
                        key={damageType}
                        checked={damageTypes.includes(damageType)}
                        onChange={() =>
                          setDamageTypes((current) =>
                            current.includes(damageType)
                              ? current.filter((value) => value !== damageType)
                              : [...current, damageType]
                          )
                        }
                        disabled={submitting}
                        tone="inverse"
                        label={damageType}
                        className="text-xs"
                      />
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ModalNumberField
                    id="promote-dice-type"
                    label="Dice type"
                    value={damageDiceType}
                    onChange={setDamageDiceType}
                    disabled={submitting}
                    min={1}
                    placeholder="e.g. 6"
                  />
                  <ModalNumberField
                    id="promote-number-dice"
                    label="Number of dice"
                    value={damageNumberOfDice}
                    onChange={setDamageNumberOfDice}
                    disabled={submitting}
                    min={1}
                    placeholder="e.g. 2"
                  />
                </div>
              </div>
            ) : null}
            {error ? (
              <p className="text-sm text-neblirDanger-400">{error}</p>
            ) : null}
          </div>
        )}
      </ModalShell>
    </>
  );
}
