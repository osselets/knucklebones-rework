import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous, jwt } from 'better-auth/plugins'
import { reactStartCookies } from 'better-auth/react-start'
import { db } from './db'

export const auth = betterAuth({
  appName: process.env.APP_NAME,
  secret: process.env.BETTER_AUTH_SECRET!,
  database: drizzleAdapter(db, {
    provider: 'pg'
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  },
  // convex only supports ES256 and RS256. Ideally would use Ed25519
  plugins: [
    anonymous(),
    jwt({
      jwks: { keyPairConfig: { alg: 'RS256' } },
      jwt: { audience: process.env.APP_NAME }
    }),
    reactStartCookies()
  ],
  session: {
    // https://www.better-auth.com/docs/guides/optimizing-for-performance#cookie-cache
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 // Cache duration in seconds
    }
  }
  // can use database hooks to sync some stuff with convex, e.g. if I want to
  // store player's name in convex, so that I don't need to fetch it from
  // the auth database
  // https://github.com/sheriffyusuf/betterauth-convex-nextjs/blob/6f5a93cb99111e5e782f23b66be2000a8676bcfa/src/lib/auth.ts#L48
  // idk if I can use the convex client to call the endpoint rather than fetching it myself
  // databaseHooks
})
