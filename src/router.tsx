import { type PropsWithChildren } from 'react'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { ConvexQueryClient } from '@convex-dev/react-query'
import { QueryClient } from '@tanstack/react-query'
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routerWithQueryClient } from '@tanstack/react-router-with-query'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  const CONVEX_URL = import.meta.env.VITE_CONVEX_URL!
  const convexClient = new ConvexReactClient(CONVEX_URL)
  const convexQueryClient = new ConvexQueryClient(convexClient)
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn()
      }
    }
  })
  convexQueryClient.connect(queryClient)

  // `routerWithQueryClient` is used to provide some default and optimized configs
  // but we can make it work without it
  // https://github.com/TanStack/router/blob/main/packages/react-router-with-query/src/index.tsx
  const router = routerWithQueryClient(
    createTanStackRouter({
      routeTree,
      scrollRestoration: true,
      context: { queryClient, convexQueryClient, convexClient },
      Wrap({ children }: PropsWithChildren) {
        return <ConvexProvider client={convexClient}>{children}</ConvexProvider>
      }
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
