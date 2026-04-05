import { signOut } from "@/auth";

export function SignOut() {
  return (
    <form
      className="inline-flex"
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-md bg-transparent px-3 text-sm font-semibold text-black transition-colors duration-500 ease-in-out hover:cursor-pointer active:bg-paleBlue/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-black md:hover:bg-paleBlue/30 md:active:bg-paleBlue/40"
      >
        Sign Out
      </button>
    </form>
  );
}
