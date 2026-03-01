import { signOut } from "@/auth";

export function SignOut() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="min-h-11 rounded-md bg-transparent text-sm font-semibold text-black transition-colors hover:bg-black/10 active:bg-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-black hover:cursor-pointer"
      >
        Sign Out
      </button>
    </form>
  );
}
