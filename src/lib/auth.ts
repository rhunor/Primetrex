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

        // Allow login regardless of activation — middleware handles unpaid redirect
        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          referralCode: user.referralCode,
          isActive: user.isActive,
          isEmailVerified: !!user.isEmailVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>;
        (token as Record<string, unknown>).role = u.role;
        (token as Record<string, unknown>).referralCode = u.referralCode;
        (token as Record<string, unknown>).isActive = u.isActive;
        (token as Record<string, unknown>).isEmailVerified = u.isEmailVerified;
      }
      // Refresh mutable fields from DB when session.update() is called client-side
      if (trigger === "update") {
        const { default: dbConnect } = await import("@/lib/db");
        const { default: User } = await import("@/models/User");
        await dbConnect();
        const dbUser = await User.findById(token.sub).lean() as Record<string, unknown> | null;
        if (dbUser) {
          (token as Record<string, unknown>).isEmailVerified = !!dbUser.isEmailVerified;
          (token as Record<string, unknown>).isActive = dbUser.isActive;
        }
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
        s.isActive = tok.isActive as boolean;
        s.isEmailVerified = tok.isEmailVerified as boolean;
      }
      return session;
    },
  },
});
