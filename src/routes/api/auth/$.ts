import { createAPIFileRoute } from '@tanstack/react-start/api'
import { auth } from '~/lib/server/auth'

export const APIRoute = createAPIFileRoute('/api/auth/$')({
  GET: async ({ request }) => {
    return await auth.handler(request)
  },
  POST: async ({ request }) => {
    return await auth.handler(request)
  }
})
