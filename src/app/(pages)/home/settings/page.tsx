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
import type { CharacterLayoutMode } from "@/app/lib/types/user";
import { useUser } from "@/hooks/use-user";
import {
  deleteCurrentUser,
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

  const effectiveLayoutMode = useMemo<CharacterLayoutMode>(
    () => user?.characterLayoutMode ?? "horizontal",
    [user?.characterLayoutMode]
  );

  useEffect(() => {
    setLayoutMode(effectiveLayoutMode);
  }, [effectiveLayoutMode]);

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
