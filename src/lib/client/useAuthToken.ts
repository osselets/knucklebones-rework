import { type ComponentProps, useCallback, useMemo } from 'react'
import { getWebRequest } from '@tanstack/react-start/server'
import { type ConvexProviderWithAuth } from 'convex/react'
import { queryOptions, useQueryClient } from '@tanstack/react-query'
import { createIsomorphicFn } from '@tanstack/react-start'
import { auth } from '../server/auth'
import { authClient } from './auth'

type UseAuthToken = ComponentProps<typeof ConvexProviderWithAuth>['useAuth']
type FetchAccessToken = ReturnType<UseAuthToken>['fetchAccessToken']

// allows to get the token from client or server, to prefetch it during SSR
// I'm not storing the token anywhere, just using it in-memory, which should be
// plenty enough during a user session (one game). Should be safer than persisting
// it in local storage or cookies.
const getToken = createIsomorphicFn()
  .client(async () => {
    const { data } = await authClient.token()
    return data?.token ?? ''
  })
  .server(async () => {
    const { token } = await auth.api.getToken({
      headers: getWebRequest()!.headers
    })
    return token
  })

export const tokenQueryOptions = queryOptions({
  queryKey: ['token'],
  async queryFn() {
    return await getToken()
  },
  // 14 minutes, to have some leeway since the JWT expiration time is 15 minutes
  gcTime: 14 * 60 * 60 * 1000,
  // this explicitly sets the data as not stale for the same time, so that it
  // does not refetch when calling `fetchQuery`
  staleTime: 14 * 60 * 60 * 1000
})

// seems like it's being re-rendered some times and it fetches a new token when
// it shouldn't. a bit sub-optimized but it works.
export const useAuthToken: UseAuthToken = () => {
  const queryClient = useQueryClient()
  const { data: sessionData, isPending } = authClient.useSession()

  const isAuthenticated = sessionData?.session.id !== undefined
  const isLoading = isPending

  const fetchAccessToken: FetchAccessToken = useCallback(
    async ({ forceRefreshToken }) => {
      if (!isAuthenticated) return null

      // can't use `useQuery` directly, as it cause the hook to re-render when
      // calling `refetch`, causing `convex` to re-call it, infinite loop
      // though, we can benefit from the cache here with `queryClient`
      // perhaps overkill, idk yet
      const token = await queryClient.fetchQuery({
        ...tokenQueryOptions,
        staleTime: forceRefreshToken ? 0 : undefined
      })
      return token
    },
    [isAuthenticated, queryClient]
  )

  return useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      fetchAccessToken
    }),
    [fetchAccessToken, isAuthenticated, isLoading]
  )
}
