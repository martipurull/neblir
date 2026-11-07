"use client";

import { Button } from "@/app/components/shared/Button";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { FieldLabel } from "@/app/components/shared/FieldLabel";
import { NumberField } from "@/app/components/shared/NumberField";
import {
  BOT_UPGRADE_LABELS,
  BOT_UPGRADE_TRACKS,
  shownTrackFigure,
  type BotUpgradeTrack,
} from "@/app/lib/botTracks";
import type { BotHolding, BotHoldingPatch } from "@/app/lib/types/bot";
import { useState } from "react";

const ROLL_BLOCKED_LABEL = {
  BROKEN: "Broken",
  BEYOND_REPAIR: "Beyond repair",
  BATTERY_EMPTY: "Battery empty",
} as const;

function upgradeDrafts(holding: BotHolding): Record<BotUpgradeTrack, string> {
  return {
    processingPower: String(holding.attributes.processingPower.upgrade),
    physicalPower: String(holding.attributes.physicalPower.upgrade),
    finesseCapacity: String(holding.attributes.finesseCapacity.upgrade),
    gridProtection: String(holding.attributes.gridProtection.upgrade),
    battery: String(holding.battery.upgrade),
  };
}

export function BotHoldingTracksSection({
  holding,
  locked,
  onSave,
}: {
  holding: BotHolding;
  locked: boolean;
  onSave: (body: BotHoldingPatch, fallback: string) => Promise<boolean>;
}) {
  const [drafts, setDrafts] = useState(() => upgradeDrafts(holding));

  const saveUpgrade = (track: BotUpgradeTrack) => {
    const raw = drafts[track].trim();
    const current =
      track === "battery"
        ? holding.battery.upgrade
        : holding.attributes[track].upgrade;
    if (!/^-?\d+$/.test(raw)) {
      setDrafts((prev) => ({ ...prev, [track]: String(current) }));
      return;
    }
    const upgrade = Number(raw);
    if (upgrade === current) return;
    void onSave(
      { action: "setUpgrade", track, upgrade },
      "Failed to update upgrade"
    ).then((saved) => {
      if (!saved) {
        setDrafts((prev) => ({ ...prev, [track]: String(current) }));
      }
    });
  };

  return (
    <section className="space-y-3">
      <div>
        <div className="font-medium text-white">Attributes and battery</div>
        <p className="text-xs text-white/65">
          An upgrade of 0 shows the base. Any other upgrade shows the effective
          value and the signed upgrade.
        </p>
        {holding.mayRoll ? null : (
          <p className="mt-1 text-xs text-neblirDanger-300">
            Cannot roll:{" "}
            {holding.rollBlockedReason
              ? ROLL_BLOCKED_LABEL[holding.rollBlockedReason]
              : "Unavailable"}
          </p>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {BOT_UPGRADE_TRACKS.filter((track) => track !== "battery").map(
          (track) => {
            const figure = holding.attributes[track];
            return (
              <div
                key={track}
                className="rounded-md border border-white/10 bg-white/5 px-3 py-2"
              >
                <div className="text-[11px] uppercase tracking-wider text-white/60">
                  {BOT_UPGRADE_LABELS[track]}
                </div>
                <div className="mt-1 text-sm text-white">
                  {shownTrackFigure(
                    figure.base,
                    figure.effective,
                    figure.signedUpgrade
                  )}
                </div>
                <FieldLabel
                  id={`bot-upgrade-${holding.id}-${track}`}
                  label="Upgrade"
                  required={false}
                />
                <NumberField
                  id={`bot-upgrade-${holding.id}-${track}`}
                  variant="dark"
                  value={drafts[track]}
                  disabled={locked}
                  min={-5}
                  max={figure.maxPotential}
                  onChange={(value) =>
                    setDrafts((prev) => ({ ...prev, [track]: value }))
                  }
                  onBlur={() => saveUpgrade(track)}
                />
                <p className="mt-1 text-[10px] text-white/50">
                  From -5 through +{figure.maxPotential}
                </p>
              </div>
            );
          }
        )}
        <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
          <div className="text-[11px] uppercase tracking-wider text-white/60">
            Battery
          </div>
          <div className="mt-1 text-sm text-white">
            {shownTrackFigure(
              holding.battery.base,
              holding.battery.effectiveCapacity,
              holding.battery.signedUpgrade
            )}
          </div>
          <p className="mt-1 text-xs text-white/70">
            {holding.battery.used} used · {holding.battery.remaining} remaining
          </p>
          <div className="mt-2 flex items-center gap-2">
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              className="disabled:!opacity-40"
              disabled={locked || holding.battery.used <= 0}
              aria-label="Decrease battery used"
              onClick={() => {
                void onSave(
                  {
                    action: "setBatteryUsed",
                    batteryUsed: holding.battery.used - 1,
                  },
                  "Failed to update battery"
                );
              }}
            >
              −
            </Button>
            <span className="min-w-[2.5rem] text-center text-sm font-bold text-white">
              {holding.battery.used}
            </span>
            <Button
              type="button"
              variant="modalIconStepper"
              fullWidth={false}
              className="disabled:!opacity-40"
              disabled={
                locked ||
                holding.battery.used >= holding.battery.effectiveCapacity
              }
              aria-label="Increase battery used"
              onClick={() => {
                void onSave(
                  {
                    action: "setBatteryUsed",
                    batteryUsed: holding.battery.used + 1,
                  },
                  "Failed to update battery"
                );
              }}
            >
              +
            </Button>
          </div>
          <FieldLabel
            id={`bot-upgrade-${holding.id}-battery`}
            label="Battery upgrade"
            required={false}
          />
          <NumberField
            id={`bot-upgrade-${holding.id}-battery`}
            variant="dark"
            value={drafts.battery}
            disabled={locked}
            min={-5}
            max={holding.battery.maxPotential}
            onChange={(value) =>
              setDrafts((prev) => ({ ...prev, battery: value }))
            }
            onBlur={() => saveUpgrade("battery")}
          />
          <p className="mt-1 text-[10px] text-white/50">
            From -5 through +{holding.battery.maxPotential}. Capacity cannot
            fall below 0.
          </p>
        </div>
      </div>
      <Checkbox
        checked={holding.isBeyondRepair}
        onChange={(checked) => {
          void onSave(
            { action: "setBeyondRepair", isBeyondRepair: checked },
            "Failed to update condition"
          );
        }}
        label="Beyond repair"
        disabled={locked}
        tone="inverse"
      />
      <p className="text-xs text-white/60">
        Beyond repair stays until someone clears it. Healing above 0 returns
        Operational only while the flag is clear. Broken is 0 HP.
      </p>
    </section>
  );
}
