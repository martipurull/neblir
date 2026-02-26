import { BackButton } from "@/app/components/BackButton";
import { SignOut } from "@/app/components/SignOut";

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="min-h-screen bg-gray-100 px-4 pb-6 pt-1 sm:px-8 sm:pb-8 sm:pt-3">
        <nav className="mb-10 flex items-center justify-between sm:mb-16">
          <BackButton />
          <SignOut />
        </nav>
        {children}
      </main>
    </>
  );
}
