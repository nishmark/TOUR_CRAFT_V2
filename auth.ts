import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && profile) {
        try {
          // Check if user already exists in our database
          const existingUser = await prisma.tcUser.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            // Create new user in our database
            await prisma.tcUser.create({
              data: {
                email: user.email!,
                name: user.name || "Unknown",
                emailVerified: true,
              },
            });
            console.log("✅ New user saved to database:", user.email);
          } else {
            console.log("ℹ️ User already exists in database:", user.email);
          }
        } catch (error) {
          console.error("❌ Error saving user to database:", error);
          // Don't block sign in if database save fails
        }
      }
      return true;
    },
  },
});
