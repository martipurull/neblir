"use client";

import type {
  ReferenceCategory,
  ReferenceEntry,
} from "@/app/lib/types/reference";
import { useReferenceEntries } from "@/hooks/use-reference-entries";
import React, { useState } from "react";
import Button from "../shared/Button";
import ErrorState from "../shared/ErrorState";
import InfoCard from "../shared/InfoCard";
import LoadingState from "../shared/LoadingState";
import PageSection from "../shared/PageSection";
import PageTitle from "../shared/PageTitle";
import { ReferenceEntryHtml } from "./ReferenceEntryHtml";

interface ReferenceEntriesPageProps {
  category: ReferenceCategory;
  gameId?: string;
  showAccessBadges?: boolean;
  title: string;
  description: string;
  loadingText: string;
  emptyText: string;
}

function ReferenceEntryContent({ entry }: { entry: ReferenceEntry }) {
  return (
    <>
      {entry.summary ? (
        <p className="mb-3 text-sm text-black/70">{entry.summary}</p>
      ) : null}
      <ReferenceEntryHtml
        contentJson={entry.contentJson}
        contentHtml={entry.contentHtml}
      />
    </>
  );
}

export function ReferenceEntriesPage({
  category,
  gameId,
  showAccessBadges,
  title,
  description,
  loadingText,
  emptyText,
}: ReferenceEntriesPageProps) {
  const { entries, loading, error, refetch } = useReferenceEntries({
    category,
    gameId,
  });
  const [expandedEntryIds, setExpandedEntryIds] = useState<Set<string>>(
    () => new Set()
  );
  const showAccessBadge = showAccessBadges ?? category === "CAMPAIGN_LORE";

  const hasMultipleEntries = entries.length > 1;

  function toggleEntry(entryId: string) {
    setExpandedEntryIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <PageSection>
        <PageTitle>{title}</PageTitle>
        <InfoCard>
          <LoadingState text={loadingText} />
        </InfoCard>
      </PageSection>
    );
  }

  return (
    <PageSection>
      <PageTitle>{title}</PageTitle>
      <p className="mt-2 text-sm text-black/75">{description}</p>

      {error ? (
        <InfoCard>
          <ErrorState message={error} onRetry={refetch} />
        </InfoCard>
      ) : entries.length === 0 ? (
        <InfoCard>
          <p className="text-sm text-black/70">{emptyText}</p>
        </InfoCard>
      ) : (
        <div className="mt-5 space-y-5">
          {entries.map((entry) => {
            const isExpanded =
              !hasMultipleEntries || expandedEntryIds.has(entry.id);

            return (
              <article
                key={entry.id}
                className={`rounded-md border border-black bg-paleBlue/10 p-4 transition-colors duration-200 ease-in-out ${hasMultipleEntries ? "md:hover:bg-paleBlue/30" : ""}`.trim()}
              >
                {hasMultipleEntries ? (
                  <Button
                    type="button"
                    variant="lightReferenceDisclosure"
                    aria-expanded={isExpanded}
                    onClick={() => toggleEntry(entry.id)}
                  >
                    <span>
                      <span className="block text-lg font-semibold text-black">
                        {entry.title}
                      </span>
                      {showAccessBadge ? (
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            entry.access === "GAME_MASTER"
                              ? "border-black/40 bg-black/10 text-black"
                              : "border-customPrimary/60 bg-customPrimary/10 text-black"
                          }`}
                        >
                          {entry.access === "GAME_MASTER"
                            ? "GM only"
                            : "Player"}
                        </span>
                      ) : null}
                      {entry.summary ? (
                        <span className="mt-1 block text-sm text-black/70">
                          {entry.summary}
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-black/70">
                      {isExpanded ? "Hide" : "Show"}
                    </span>
                  </Button>
                ) : (
                  <header className="mb-3">
                    <h2 className="text-lg font-semibold text-black">
                      {entry.title}
                    </h2>
                    {showAccessBadge ? (
                      <span
                        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          entry.access === "GAME_MASTER"
                            ? "border-black/40 bg-black/10 text-black"
                            : "border-customPrimary/60 bg-customPrimary/10 text-black"
                        }`}
                      >
                        {entry.access === "GAME_MASTER" ? "GM only" : "Player"}
                      </span>
                    ) : null}
                  </header>
                )}

                {isExpanded ? (
                  <div className={hasMultipleEntries ? "mt-4" : ""}>
                    <ReferenceEntryContent entry={entry} />
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </PageSection>
  );
}
