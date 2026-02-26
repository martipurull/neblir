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
        className="min-h-11 rounded-md bg-red-500 text-sm font-semibold text-white transition-colors hover:bg-red-600 active:bg-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 hover:cursor-pointer"
      >
        Sign Out
      </button>
    </form>
  );
}
