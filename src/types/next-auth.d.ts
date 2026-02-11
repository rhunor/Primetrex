import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      referralCode: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
    referralCode: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    referralCode: string;
  }
}
