import Button from "@/app/components/shared/Button";
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
      <Button type="submit" variant="ghostNav">
        Sign Out
      </Button>
    </form>
  );
}
