import { v } from 'convex/values'
import {
  customQuery,
  customMutation
} from 'convex-helpers/server/customFunctions'
import { GameStateWithDb } from '../GameStateWithDb'
import { type Id } from '../_generated/dataModel'
import {
  type QueryCtx,
  type MutationCtx,
  query,
  mutation
} from '../_generated/server'
import { getUserIdOrThrow } from '../utils/auth'

export async function getGameState(
  ctx: QueryCtx | MutationCtx,
  gameId: Id<'kb_games'>
) {
  const userId = await getUserIdOrThrow(ctx)
  return { userId, gameState: await GameStateWithDb.get(ctx, userId, gameId) }
}

export const gameStateQuery = customQuery(query, {
  args: { gameId: v.id('kb_games') },
  async input(ctx, { gameId }) {
    return {
      ctx: await getGameState(ctx, gameId),
      args: {}
    }
  }
})

export const gameStateMutation = customMutation(mutation, {
  args: { gameId: v.id('kb_games') },
  async input(ctx, { gameId }) {
    return {
      ctx: await getGameState(ctx, gameId),
      args: {}
    }
  }
})
