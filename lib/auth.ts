import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { prisma } from "@/lib/prisma"
import { nextCookies } from "better-auth/next-js"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      displayName: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Idempotent: retries or duplicate hook runs must not orphan or
          // crash signup when the profile row already exists.
          await prisma.profiles.upsert({
            where: { id: user.id },
            update: {
              email: user.email,
              display_name: (user.displayName as string) || user.name,
            },
            create: {
              id: user.id,
              email: user.email,
              display_name: (user.displayName as string) || user.name,
            },
          })
        },
      },
    },
  },
  plugins: [nextCookies()],
})
