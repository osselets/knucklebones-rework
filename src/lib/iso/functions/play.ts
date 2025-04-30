import { type } from 'arktype'
import { createServerFn } from '@tanstack/react-start'
import { getRandomIntInclusive } from '~/common'
import { GameStateWithDb } from '~/lib/server/business/GameStateWithDb'
import { throwError } from '~/lib/server/db'
import { syncGameState } from '~/lib/server/sync'
import { Ai } from '../business/Ai'
import { getGameFn } from './getGame'
import { authMiddleware } from './middlewares'

const playSchema = type({
  gameId: 'string.uuid',
  column: '0 <= number.integer <= 2'
})

function delayPlay(play: () => Promise<void>) {
  const [min, max] =
    import.meta.env.MODE === 'development' ? [100, 200] : [500, 1000]
  const ms = getRandomIntInclusive(min, max)
  setTimeout(() => {
    void play()
  }, ms)
}

export const playFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    const play = playSchema(data)
    if (play instanceof type.errors) {
      throw new Error(play.summary)
    }
    return play
  })
  .handler(async ({ data, context }) => {
    const { column, gameId } = data
    const userId = context.session.session.userId

    // /!\ getGameFn returns a PreparedGameState, not necessary (or should it be?)
    const gameState = new GameStateWithDb(await getGameFn({ data: gameId }))

    await gameState.play(userId, column)

    if (gameState.isAgainstAi && !gameState.hasEnded) {
      delayPlay(async () => {
        // wonder if this should be a method in GameState, probably not necessary
        // though, one thing that could be useful is when I'll have multiple AIs
        // to play, reaching for their ids
        const ai = new Ai(gameState, process.env.AI_1_USER_ID!)
        const move = ai.suggestNextPlay()
        await gameState.play(process.env.AI_1_USER_ID!, move.column)
        const result = await syncGameState(gameState.toJson)
        // throwing stop the server, not good
        if (result.isErr()) {
          throwError(result.error)
        }
      })
    }

    const result = await syncGameState(gameState.toJson)
    if (result.isErr()) {
      throwError(result.error)
    }
  })
