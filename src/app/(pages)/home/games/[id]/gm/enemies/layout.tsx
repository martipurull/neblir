import { Suspense } from "react";
import LoadingState from "@/app/components/shared/LoadingState";
import PageSection from "@/app/components/shared/PageSection";

/**
 * Next.js App Router: nested client pages under /home can still hit CSR bailout / 404
 * if a child or boundary expects Suspense. Wrap GM enemy routes (instance page, etc.).
 */
export default function GmEnemiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <PageSection>
          <LoadingState text="Loading…" />
        </PageSection>
      }
    >
      {children}
    </Suspense>
  );
}
