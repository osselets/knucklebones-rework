import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  // can add auth session here
  const queryClient = new QueryClient()

  // `routerWithQueryClient` is used to provide some default and optimized configs
  // but we can make it work without it
  // https://github.com/TanStack/router/blob/main/packages/react-router-with-query/src/index.tsx
  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      scrollRestoration: true,
      context: { queryClient }
    }),
    queryClient
  )

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
