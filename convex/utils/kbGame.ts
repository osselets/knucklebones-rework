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
  mutation,
  internalMutation
} from '../_generated/server'
import { getUserIdOrThrow } from '../utils/auth'

export async function getGameAndPlayers(
  ctx: QueryCtx | MutationCtx,
  gameId: Id<'kb_games'>
) {
  const [game, players] = await Promise.allSettled([
    ctx.db.get(gameId),
    ctx.db
      .query('kb_game_players')
      .withIndex('by_game_and_user', (q) => q.eq('gameId', gameId))
      .take(2)
  ])
  if (game.status === 'rejected' || game.value === null) {
    throw new Error('Game not found')
  }
  if (players.status === 'rejected' || players.value.length === 0) {
    throw new Error('Players not found')
  }

  return { game: game.value, players: players.value }
}

export async function getGameState(
  ctx: QueryCtx | MutationCtx,
  gameId: Id<'kb_games'>
) {
  const userId = await getUserIdOrThrow(ctx)
  const { game, players } = await getGameAndPlayers(ctx, gameId)
  const gameState = new GameStateWithDb({
    ctx,
    userId,
    game,
    players
  })
  return { userId, gameState }
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

export const aiMutation = customMutation(internalMutation, {
  // could add aiId: v.string() later when I have to deal with multiple ais?
  args: { gameId: v.id('kb_games') },
  async input(ctx, { gameId }) {
    const { game, players } = await getGameAndPlayers(ctx, gameId)
    const gameState = new GameStateWithDb({
      userId: process.env.AI_1_USER_ID!,
      ctx,
      game,
      players
    })
    return {
      ctx: { gameState },
      args: {}
    }
  }
})
