import { useEffect } from 'react'
import { type } from 'arktype'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { getGameForUserFn } from '~/lib/iso/functions/getGame'
import { preparedGameStateType } from '~/lib/iso/utils/prepareGameState'

interface UseSSEOptions {
  url: string
  onMessage(data: string, event: MessageEvent): void
}

// to be shared once we have multiple games based on this system
function useSSE({ url, onMessage }: UseSSEOptions) {
  useEffect(() => {
    const eventSource = new EventSource(url)
    eventSource.onmessage = (event) => {
      onMessage(event.data, event)
    }
    return () => {
      eventSource.close()
    }
  }, [])
}

export const gameQueryOptions = (gameId: string) =>
  queryOptions({
    queryKey: ['game', gameId],
    async queryFn() {
      return await getGameForUserFn({ data: gameId })
    }
  })

const gameRoute = getRouteApi('/game/$id')

export function useGame() {
  const { id } = gameRoute.useParams()
  const { queryClient } = gameRoute.useRouteContext()
  // gameQueryOptions is used to load data at the route level
  const { data } = useSuspenseQuery(gameQueryOptions(id))

  useSSE({
    url: `/api/game/${id}/sse`,
    onMessage(data) {
      const gameState = preparedGameStateType(JSON.parse(data))
      if (gameState instanceof type.errors) {
        // feedback error to user
        console.error(gameState.summary)
        return
      }
      queryClient.setQueryData(gameQueryOptions(id).queryKey, gameState)
    }
  })

  return data
}
