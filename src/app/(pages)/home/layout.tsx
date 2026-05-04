import { Suspense } from "react";
import { BackButton } from "@/app/components/BackButton";
import { HomeButton } from "@/app/components/HomeButton";
import { SignOut } from "@/app/components/SignOut";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex h-dvh flex-col overflow-hidden bg-transparent px-4 pb-6 pt-1 sm:px-8 sm:pb-8 sm:pt-3">
        <nav className="mb-1 flex shrink-0 items-center justify-between gap-2 sm:mb-2">
          <div className="min-w-0 flex-1 basis-0 text-left">
            {/*
              BackButton uses useSearchParams(). Next App Router requires a Suspense
              boundary above any such hook (CSR bailout). This wraps all /home routes,
              not only the GM page — without it, /home/games/[id]/gm can resolve as 404.
            */}
            <Suspense
              fallback={
                <div className="inline-block min-h-[2.25rem] min-w-[4rem]" />
              }
            >
              <BackButton />
            </Suspense>
          </div>
          <HomeButton />
          <div className="flex min-w-0 flex-1 basis-0 justify-end">
            <SignOut />
          </div>
        </nav>
        <div
          id="app-scroll"
          className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto"
        >
          {children}
        </div>
      </main>
    </>
  );
}
