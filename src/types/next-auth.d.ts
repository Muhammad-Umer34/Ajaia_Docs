import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    avatarColor?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      avatarColor?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    avatarColor?: string;
  }
}
