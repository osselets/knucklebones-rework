import { useEffect, useMemo } from 'react'
import {
  convexQuery,
  useConvexAuth,
  useConvexMutation
} from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { api } from '~/convex/api'
import { type Id } from '~/convex/dataModel'
import { authClient } from '~/lib/client/auth'
import { ClientGameState } from '~/new-common'

const gameRoute = getRouteApi('/game/$id')

export function useGameState() {
  const { isAuthenticated } = useConvexAuth()
  const { data: session } = authClient.useSession()
  const { id } = gameRoute.useParams()
  const gameId = id as Id<'kb_games'>

  const { data: gameStateData } = useQuery(
    convexQuery(api.kbGame.getGame, { gameId })
  )
  const gameState = useMemo(() => {
    if (gameStateData === undefined || session === null) {
      return null
    }
    return new ClientGameState({
      ...gameStateData,
      userId: session.session.userId
    })
  }, [gameStateData, session])

  // meh ideally this would be handled in the beforeload of the route, but
  // i'll have to find a way to call Convex outside of react
  const { mutate, status } = useMutation({
    mutationFn: useConvexMutation(api.kbGame.joinGame)
  })
  useEffect(() => {
    if (isAuthenticated && status === 'idle') {
      mutate({ gameId })
    }
  }, [gameId, mutate, isAuthenticated, status])

  return gameState
}
