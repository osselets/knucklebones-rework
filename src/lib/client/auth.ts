import { anonymousClient, jwtClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  // if I want to persist the token client side, I could use the `onResponse`
  // (`onSuccess` is not called, bug) to grab it from the headers (only if
  // cookieCache is disabled, bug).
  // fetchOptions: {}
  plugins: [anonymousClient(), jwtClient()]
})
