import { signOut } from "@/auth";

export function SignOut() {
  return (
    <form
      className="px-1 py-1 bg-red-500 text-white text-sm font-semibold rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      <button type="submit">Sign Out</button>
    </form>
  );
}
