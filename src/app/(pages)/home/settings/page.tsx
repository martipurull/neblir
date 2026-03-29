"use client";
import DangerActionFooter from "@/app/components/shared/DangerActionFooter";
import ErrorState from "@/app/components/shared/ErrorState";
import InfoCard from "@/app/components/shared/InfoCard";
import KeyValueList from "@/app/components/shared/KeyValueList";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";
import PageSubtitle from "@/app/components/shared/PageSubtitle";
import PageTitle from "@/app/components/shared/PageTitle";
import { useUser } from "@/hooks/use-user";
import { deleteCurrentUser } from "@/lib/api/user";
import { signOut } from "next-auth/react";
import React from "react";

const SettingsPage: React.FC = () => {
  const { user, loading, error, refetch } = useUser();
  const deleteAccount = async () => {
    await deleteCurrentUser();
    await signOut({ callbackUrl: "/" });
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
          <KeyValueList
            items={[
              { label: "Name", value: user.name },
              { label: "Email", value: user.email },
            ]}
          />
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
