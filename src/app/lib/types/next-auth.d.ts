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
