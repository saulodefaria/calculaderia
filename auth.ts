import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [Google],
  pages: {
    signIn: "/entrar",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;

      const emailVerified = (profile as { email_verified?: boolean | string }).email_verified;

      return Boolean(profile?.email && (emailVerified === true || emailVerified === "true"));
    },
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
});
