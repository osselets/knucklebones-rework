import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { anonymous, jwt } from 'better-auth/plugins'
import { db } from './db'

export const auth = betterAuth({
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
  // jwt might not be needed now that I don't need supabase or whatsoever
  plugins: [anonymous(), jwt()]
})
