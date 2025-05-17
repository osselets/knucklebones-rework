import { v } from 'convex/values'
import { GameStateWithDb } from '~/GameStateWithDb'
import { internal } from '~/_generated/api'
import { Ai } from '~/common'
import { boType, difficulty, voteType } from '~/schema'
import { userMutation } from '~/utils/auth'
import {
  gameStateMutation,
  gameStateQuery,
  aiMutation,
  getGameState
} from './utils/kbGame'

// probably use neverthrow here?
// https://docs.convex.dev/functions/error-handling/

export const getGame = gameStateQuery({
  // for some reason, when using custom query, I have to define args even when empty
  args: {},
  handler: async (ctx) => {
    const { game, players } = ctx.gameState.toJson
    // for some reason, if I don't provide the return like this, it's typed as any
    return { game, players }
  }
})

export const createGame = userMutation({
  args: {
    boType,
    difficulty
  },
  handler: async (ctx, { boType, difficulty }) => {
    const aiId = process.env.AI_1_USER_ID!

    const gameState = await GameStateWithDb.create({
      ctx,
      userId: ctx.userId,
      boType,
      difficulty,
      baseGameId: null
    })
    const gameId = gameState.gameId

    await gameState.join()

    if (gameState.isAgainstAi) {
      await gameState.addOpponent(aiId)

      if (gameState.nextPlayerUserId === aiId) {
        await ctx.scheduler.runAfter(1000, internal.kbGame.aiPlay, {
          gameId
        })
      }
    }

    return gameId
  }
})

// - When continue game should be done? It should be done only once, not from
// both players
// -> Like joining, that would be done after the last vote
// - Since the new game will change id, that would be a different URL, thus
// there should be a way to redirect both players after they voted?
// -> What about having a `nextGameId` field on the game entity, so that it's
// set when `continueGame` has been called, and clients are updated
export const continueGame = userMutation({
  args: {
    boType,
    previousGameId: v.id('kb_games')
  },
  handler: async (ctx, { boType, previousGameId }) => {
    const { gameState: previousGameState } = await getGameState(
      ctx,
      previousGameId
    )
    const previousGame = previousGameState.toJson.game

    const gameState = await GameStateWithDb.create({
      ctx,
      userId: ctx.userId,
      boType: boType ?? previousGame.boType,
      difficulty: previousGame.difficulty,
      baseGameId: previousGame._id
    })

    await gameState.join()
    await gameState.addOpponent(previousGameState.opponent!.userId)

    const gameId = gameState.toJson.game._id

    if (
      gameState.isAgainstAi &&
      gameState.nextPlayerUserId === gameState.opponent
    ) {
      await ctx.scheduler.runAfter(1000, internal.kbGame.aiPlay, {
        gameId
      })
    }

    return gameId
  }
})

export const voteRematchGame = gameStateMutation({
  args: {
    voteType
  },
  handler: async (ctx, { voteType }) => {
    await ctx.gameState.voteFor(voteType)
  }
})

export const joinGame = gameStateMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.gameState.join()
  }
})

export const play = gameStateMutation({
  args: { column: v.number() },
  handler: async (ctx, { column }) => {
    await ctx.gameState.play(column)

    if (ctx.gameState.isAgainstAi && !ctx.gameState.hasRoundEnded) {
      await ctx.scheduler.runAfter(1000, internal.kbGame.aiPlay, {
        gameId: ctx.gameState.toJson.game._id
      })
    }
  }
})

export const aiPlay = aiMutation({
  args: {},
  handler: async (ctx) => {
    const ai = new Ai(ctx.gameState)
    const play = ai.suggestNextPlay()
    await ctx.gameState.play(play.column)
  }
})
