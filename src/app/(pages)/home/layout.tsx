import { BackButton } from "@/app/components/BackButton";
import { SignOut } from "@/app/components/SignOut";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex h-dvh flex-col overflow-hidden bg-transparent px-4 pb-6 pt-1 sm:px-8 sm:pb-8 sm:pt-3">
        <nav className="mb-1 flex shrink-0 items-center justify-between sm:mb-2">
          <BackButton />
          <SignOut />
        </nav>
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          {children}
        </div>
      </main>
    </>
  );
}
