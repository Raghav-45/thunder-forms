import { betterAuth } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  ...(process.env.NODE_ENV !== 'production'
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []),
].filter((origin): origin is string => Boolean(origin))

export const auth = betterAuth({
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
