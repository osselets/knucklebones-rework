import { type } from 'arktype'
import { createServerFn } from '@tanstack/react-start'
import { GameStateWithDb } from '~/lib/server/business/GameStateWithDb'
import { throwError } from '~/lib/server/db'
import { syncGameState } from '~/lib/server/sync'
import { getGameFn } from './getGame'
import { authMiddleware } from './middlewares'

// later i'll need a wait to leave a game (when we'll have 2+ players per game),
// and the host has to start the game, people can leave while game status is waiting
export const joinGameFn = createServerFn({
  method: 'POST'
})
  .middleware([authMiddleware])
  .validator((data: string) => {
    const uuid = type('string.uuid')(data)
    if (uuid instanceof type.errors) {
      throwError({
        message: uuid.summary,
        type: 'InvalidUUID'
      })
    }
    return uuid
  })
  .handler(async ({ data, context }) => {
    const userId = context.session.session.userId

    // /!\ getGameFn returns a PreparedGameState, not necessary (or should it be?)
    const gameState = new GameStateWithDb(await getGameFn({ data }))

    await gameState.joinIfPossible(userId)
    const result = await syncGameState(gameState.toJson)
    if (result.isErr()) {
      throwError(result.error)
    }
  })
