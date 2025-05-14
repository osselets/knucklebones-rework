import { v } from 'convex/values'
import { GameStateWithDb } from '~/GameStateWithDb'
import { internal } from '~/_generated/api'
import { Ai } from '~/common'
import { boType, difficulty } from '~/schema'
import { userMutation } from '~/utils/auth'
import { gameStateMutation, gameStateQuery, aiMutation } from './utils/kbGame'

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
  // actually, previousGameId shouldn't be here, there should be a different
  // endpoint, so that we can reuse the settings of the previous game automatically
  handler: async (ctx, { boType, difficulty }) => {
    const gameState = await GameStateWithDb.createGameInDb({
      ctx,
      userId: ctx.userId,
      boType,
      difficulty
    })

    const aiId = process.env.AI_1_USER_ID!

    await gameState.joinIfPossible(gameState.isAgainstAi ? aiId : undefined)
    const gameId = gameState.toJson.game._id

    if (gameState.isAgainstAi && gameState.nextPlayerUserId === aiId) {
      await ctx.scheduler.runAfter(1000, internal.kbGame.aiPlay, {
        gameId
      })
    }

    return gameId
  }
})

export const joinGame = gameStateMutation({
  args: {},
  handler: async (ctx) => {
    await ctx.gameState.joinIfPossible()
  }
})

export const play = gameStateMutation({
  args: { column: v.number() },
  handler: async (ctx, { column }) => {
    await ctx.gameState.play(column)

    if (ctx.gameState.isAgainstAi && !ctx.gameState.hasEnded) {
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
