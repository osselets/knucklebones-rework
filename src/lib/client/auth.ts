import { anonymousClient, jwtClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // jwt might not be needed now that I don't need supabase or whatsoever
  plugins: [anonymousClient(), jwtClient()]
})
