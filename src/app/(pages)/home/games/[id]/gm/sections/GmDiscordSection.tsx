import Button from "@/app/components/shared/Button";
import InfoCard from "@/app/components/shared/InfoCard";
import { SelectDropdown } from "@/app/components/shared/SelectDropdown";
import type { DiscordIntegration } from "@/app/lib/types/discord";
import {
  disconnectGameDiscordIntegration,
  getDiscordConnectUrl,
  getDiscordGuildChannels,
  queueGameDiscordTest,
  saveGameDiscordIntegration,
} from "@/lib/api/game";
import { useRouter } from "next/navigation";
import React, { startTransition, useEffect, useMemo, useState } from "react";
import { GmSectionTitle } from "./GmSectionTitle";

type Props = {
  gameId: string;
  integration?: DiscordIntegration | null;
  initialGuildId?: string | null;
  onUpdated: () => void | Promise<void>;
};

export function GmDiscordSection({
  gameId,
  integration,
  initialGuildId,
  onUpdated,
}: Props) {
  const router = useRouter();
  const resolvedGuildId = integration?.guildId ?? initialGuildId ?? "";

  const [channels, setChannels] = useState<
    Array<{ id: string; name: string; channelType: number }>
  >([]);
  const [channelId, setChannelId] = useState(integration?.channelId ?? "");
  const [loadingChannels, setLoadingChannels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const id = integration?.channelId;
    if (id) {
      queueMicrotask(() => setChannelId(id));
    }
  }, [integration?.channelId]);

  useEffect(() => {
    if (!resolvedGuildId) {
      queueMicrotask(() => setChannels([]));
      return;
    }
    let cancelled = false;
    startTransition(() => {
      setLoadingChannels(true);
      setError(null);
    });
    void getDiscordGuildChannels(gameId, resolvedGuildId)
      .then((list) => {
        if (cancelled) return;
        setChannels(list);
        setChannelId((current) => {
          if (current && list.some((c) => c.id === current)) return current;
          return list[0]?.id ?? "";
        });
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load channels");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingChannels(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gameId, resolvedGuildId]);

  const hasSavedIntegration = Boolean(integration);
  /** OAuth redirect included a guild id, but PATCH has not been saved yet. */
  const pendingOAuthWithoutSave = Boolean(!integration && initialGuildId);

  const statusLine = useMemo(() => {
    if (hasSavedIntegration) {
      return `Connected to ${integration!.guildId} / channel ${integration!.channelId}.`;
    }
    if (pendingOAuthWithoutSave) {
      return "Bot added to your server — choose a text or voice channel below (voice uses that channel’s text chat), then save to finish.";
    }
    return "Not connected — add the Neblir bot to your Discord server.";
  }, [hasSavedIntegration, integration, pendingOAuthWithoutSave]);

  const channelOptions = useMemo(() => {
    const labelFor = (channel: { name: string; channelType: number }) => {
      switch (channel.channelType) {
        case 2:
          return `Voice · ${channel.name}`;
        case 13:
          return `Stage · ${channel.name}`;
        case 5:
          return `Announce · #${channel.name}`;
        default:
          return `#${channel.name}`;
      }
    };
    return channels.map((channel) => ({
      value: channel.id,
      label: labelFor(channel),
    }));
  }, [channels]);

  return (
    <InfoCard border>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <GmSectionTitle>Discord</GmSectionTitle>
      </div>
      <p className="mt-4 text-sm text-black/80">{statusLine}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        {!hasSavedIntegration && (
          <Button
            type="button"
            variant="primaryXs"
            fullWidth={false}
            onClick={() =>
              void getDiscordConnectUrl(gameId).then((url) => {
                window.location.href = url;
              })
            }
          >
            {pendingOAuthWithoutSave
              ? "Add bot to another server"
              : "Connect Discord"}
          </Button>
        )}
        {hasSavedIntegration && (
          <>
            <Button
              type="button"
              variant="lightOutlineBlackSm"
              fullWidth={false}
              onClick={() => void queueGameDiscordTest(gameId)}
            >
              Send test message
            </Button>
            <Button
              type="button"
              variant="lightOutlineDangerSm"
              fullWidth={false}
              onClick={() =>
                void disconnectGameDiscordIntegration(gameId).then(async () => {
                  setChannelId("");
                  setChannels([]);
                  await onUpdated();
                  router.replace(
                    `/home/games/${encodeURIComponent(gameId)}/gm`
                  );
                })
              }
            >
              Disconnect
            </Button>
            <Button
              type="button"
              variant="lightOutlineMutedSm"
              fullWidth={false}
              onClick={() =>
                void getDiscordConnectUrl(gameId).then((url) => {
                  window.location.href = url;
                })
              }
            >
              Reinstall bot / change server
            </Button>
          </>
        )}
      </div>

      {resolvedGuildId ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-black/70">Server ID: {resolvedGuildId}</p>
          <SelectDropdown
            id={`discord-channel-${gameId}`}
            label="Channel"
            placeholder={
              loadingChannels ? "Loading channels…" : "Select a channel"
            }
            value={channelId}
            options={channelOptions}
            disabled={loadingChannels || channelOptions.length === 0}
            onChange={setChannelId}
          />
          <Button
            type="button"
            variant="semanticSafeOutline"
            fullWidth={false}
            disabled={!channelId || saving}
            onClick={() => {
              setSaving(true);
              setError(null);
              setSuccessMessage(null);
              void saveGameDiscordIntegration(gameId, {
                guildId: resolvedGuildId,
                channelId,
              })
                .then(async () => {
                  setSuccessMessage("Discord channel saved.");
                  router.replace(
                    `/home/games/${encodeURIComponent(gameId)}/gm`
                  );
                  await onUpdated();
                })
                .catch((e: unknown) =>
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Failed to save integration"
                  )
                )
                .finally(() => setSaving(false));
            }}
            className="!px-3 !py-1.5 !text-xs"
          >
            {saving ? "Saving..." : "Save channel"}
          </Button>
        </div>
      ) : null}

      {error && <p className="mt-3 text-xs text-neblirDanger-600">{error}</p>}
      {successMessage && (
        <p className="mt-3 text-xs text-neblirSafe-600">{successMessage}</p>
      )}
    </InfoCard>
  );
}
