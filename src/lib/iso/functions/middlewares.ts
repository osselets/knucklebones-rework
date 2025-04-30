import { getWebRequest } from '@tanstack/react-start/server'
import { createMiddleware } from '@tanstack/react-start'
import { auth } from '../../server/auth'

export const authMiddleware = createMiddleware().server(async ({ next }) => {
  const session = await auth.api.getSession({
    headers: getWebRequest()!.headers
  })

  if (session === null) {
    throw new Error('User is not authenticated')
  }

  return await next({
    context: {
      session
    }
  })
})
