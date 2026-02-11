import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = z
          .object({
            email: z.string().email(),
            password: z.string().min(8),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;

        // Dynamic imports to avoid loading mongoose in Edge runtime (middleware)
        const bcrypt = await import("bcryptjs");
        const { default: dbConnect } = await import("@/lib/db");
        const { default: User } = await import("@/models/User");

        await dbConnect();

        const user = await User.findOne({ email: parsed.data.email });
        if (!user) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        // Only allow active (paid) users to sign in
        if (!user.isActive) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          referralCode: user.referralCode,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { role: string; referralCode: string };
        (token as Record<string, unknown>).role = u.role;
        (token as Record<string, unknown>).referralCode = u.referralCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const tok = token as Record<string, unknown>;
        const s = session.user as unknown as Record<string, unknown>;
        s.id = tok.sub as string;
        s.role = tok.role as string;
        s.referralCode = tok.referralCode as string;
      }
      return session;
    },
  },
});
