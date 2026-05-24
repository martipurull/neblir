// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
  interface CharacterUser {
    id: string;
    characterId: string;
    userId: string;
  }
  interface User {
    id: string;
    email: string;
    name: string;
    /** From DB; use `/api/users/me` for authoritative super-admin checks in the UI. */
    role?: "USER" | "SUPER_ADMIN";
    characters: CharacterUser[];
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: User;
  }
}
