"use client";
import { DangerActionFooter } from "@/app/components/shared/DangerActionFooter";
import { ErrorState } from "@/app/components/shared/ErrorState";
import { InfoCard } from "@/app/components/shared/InfoCard";
import { KeyValueList } from "@/app/components/shared/KeyValueList";
import { LoadingState } from "@/app/components/shared/LoadingState";
import { PageSection } from "@/app/components/shared/PageSection";
import { PageSubtitle } from "@/app/components/shared/PageSubtitle";
import { PageTitle } from "@/app/components/shared/PageTitle";
import { RadioGroup } from "@/app/components/shared/RadioGroup";
import { Checkbox } from "@/app/components/shared/Checkbox";
import { CharacterSectionOrderSettings } from "@/app/components/settings/CharacterSectionOrderSettings";
import type { CharacterLayoutMode } from "@/app/lib/types/user";
import { useUser } from "@/hooks/use-user";
import { resolveCharacterCarouselWrap } from "@/hooks/use-carousel";
import {
  deleteCurrentUser,
  updateUserCharacterCarouselWrap,
  updateUserCharacterLayoutMode,
} from "@/lib/api/user";
import { signOut } from "next-auth/react";
import React, { useEffect, useMemo, useState } from "react";

const SettingsPage: React.FC = () => {
  const { user, loading, error, refetch } = useUser();
  const [layoutMode, setLayoutMode] =
    useState<CharacterLayoutMode>("horizontal");
  const [layoutSaving, setLayoutSaving] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [carouselWrap, setCarouselWrap] = useState(true);
  const [carouselWrapSaving, setCarouselWrapSaving] = useState(false);
  const [carouselWrapError, setCarouselWrapError] = useState<string | null>(
    null
  );

  const effectiveLayoutMode = useMemo<CharacterLayoutMode>(
    () => user?.characterLayoutMode ?? "horizontal",
    [user?.characterLayoutMode]
  );

  const effectiveCarouselWrap = useMemo(
    () => resolveCharacterCarouselWrap(user?.characterCarouselWrap),
    [user?.characterCarouselWrap]
  );

  useEffect(() => {
    setLayoutMode(effectiveLayoutMode);
  }, [effectiveLayoutMode]);

  useEffect(() => {
    setCarouselWrap(effectiveCarouselWrap);
  }, [effectiveCarouselWrap]);

  const deleteAccount = async () => {
    await deleteCurrentUser();
    await signOut({ callbackUrl: "/" });
  };

  const handleLayoutChange = async (value: string) => {
    if (!user) return;
    if (value !== "horizontal" && value !== "vertical") return;
    const nextMode = value as CharacterLayoutMode;
    if (nextMode === effectiveLayoutMode) return;

    setLayoutMode(nextMode);
    setLayoutSaving(true);
    setLayoutError(null);
    try {
      await updateUserCharacterLayoutMode(user.id, nextMode);
      await refetch();
    } catch (e) {
      setLayoutMode(effectiveLayoutMode);
      setLayoutError(
        e instanceof Error
          ? e.message
          : "Failed to update character layout preference"
      );
    } finally {
      setLayoutSaving(false);
    }
  };

  const handleCarouselWrapChange = async (checked: boolean) => {
    if (!user) return;
    if (checked === effectiveCarouselWrap) return;

    setCarouselWrap(checked);
    setCarouselWrapSaving(true);
    setCarouselWrapError(null);
    try {
      await updateUserCharacterCarouselWrap(user.id, checked);
      await refetch();
    } catch (e) {
      setCarouselWrap(effectiveCarouselWrap);
      setCarouselWrapError(
        e instanceof Error
          ? e.message
          : "Failed to update carousel wrap preference"
      );
    } finally {
      setCarouselWrapSaving(false);
    }
  };

  return (
    <PageSection>
      <PageTitle>Settings</PageTitle>
      <PageSubtitle>
        Your user details come directly from your Google account.
      </PageSubtitle>
      <InfoCard>
        {loading && <LoadingState text="Loading user..." />}

        {!loading && error && (
          <ErrorState message={error} onRetry={refetch} retryLabel="Retry" />
        )}

        {!loading && !error && user && (
          <div className="space-y-4">
            <KeyValueList
              items={[
                { label: "Name", value: user.name },
                { label: "Email", value: user.email },
              ]}
            />
            <div className="border-t border-black/20 pt-4">
              <RadioGroup
                name="character-layout-mode"
                label="Character Page Layout"
                value={layoutMode}
                options={[
                  { value: "horizontal", label: "Horizontal (carousel)" },
                  { value: "vertical", label: "Vertical (scrolling cards)" },
                ]}
                onChange={(value) => {
                  void handleLayoutChange(value);
                }}
                disabled={layoutSaving}
              />
              {layoutError ? (
                <p className="mt-2 text-sm text-neblirDanger-600">
                  {layoutError}
                </p>
              ) : null}
              <div className="mt-4 border-t border-black/20 pt-4">
                <p className="text-sm font-bold text-black">
                  Carousel wrap at ends
                </p>
                <p className="mt-1 text-xs text-black/75">
                  When enabled, scrolling past the first or last section in the
                  horizontal carousel jumps to the opposite end. Only applies
                  when horizontal layout is selected.
                </p>
                <Checkbox
                  checked={carouselWrap}
                  onChange={(checked) => {
                    void handleCarouselWrapChange(checked);
                  }}
                  disabled={carouselWrapSaving || layoutSaving}
                  className="mt-3"
                  label="Wrap carousel at ends"
                />
                {carouselWrapError ? (
                  <p className="mt-2 text-sm text-neblirDanger-600">
                    {carouselWrapError}
                  </p>
                ) : null}
                <CharacterSectionOrderSettings
                  userId={user.id}
                  savedOrder={user.characterSectionOrder}
                  onSaved={refetch}
                  disabled={layoutSaving || carouselWrapSaving}
                />
              </div>
            </div>
          </div>
        )}
      </InfoCard>
      <DangerActionFooter
        note={
          <>
            Deleting your account will remove all your data, including
            characters and games, from the system.
          </>
        }
        actionLabel="Delete Account"
        confirmTitle="Delete account?"
        confirmDescription="This will permanently remove your account and all related data. This action cannot be undone."
        confirmLabel="Yes, delete account"
        onConfirm={deleteAccount}
      />
    </PageSection>
  );
};

export default SettingsPage;
