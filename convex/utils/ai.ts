import { v } from 'convex/values'
import { customMutation } from 'convex-helpers/server/customFunctions'
import { internal } from '~/_generated/api'
import { type Id } from '~/_generated/dataModel'
import { getRandomIntInclusive } from '~/common'
import { GameStateWithDb } from '../GameStateWithDb'
import { internalMutation, type MutationCtx } from '../_generated/server'

export async function aiPlayWithDelay(
  ctx: MutationCtx,
  gameId: Id<'kb_games'>
) {
  const [min, max] =
    process.env.NODE_ENV === 'development' ? [100, 200] : [500, 1000]
  const ms = getRandomIntInclusive(min, max)
  await ctx.scheduler.runAfter(ms, internal.kbGame.aiPlay, {
    gameId
  })
}

export const aiMutation = customMutation(internalMutation, {
  // could add aiId: v.string() later when I have to deal with multiple ais?
  args: { gameId: v.id('kb_games') },
  async input(ctx, { gameId }) {
    return {
      ctx: {
        gameState: await GameStateWithDb.get(
          ctx,
          process.env.AI_1_USER_ID!,
          gameId
        )
      },
      args: {}
    }
  }
})
