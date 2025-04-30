import { type } from 'arktype'
import { ResultAsync } from 'neverthrow'
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { kbGameStateType } from '~/lib/iso/types/kbGame'
import { db, parseDbError, throwError } from '~/lib/server/db'
import { prepareGameState } from '../utils/prepareGameState'
import { authMiddleware } from './middlewares'

// to be used server side
export const getGameFn = createServerFn({ method: 'GET' })
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
    const game = await ResultAsync.fromPromise(
      db.query.kbGame.findFirst({
        where: (kbGame, { eq }) => eq(kbGame.id, data),
        with: {
          players: {
            with: {
              user: {
                columns: {
                  name: true
                }
              }
            }
          }
        }
      }),
      parseDbError
    )

    if (game.isErr()) {
      throwError(game.error)
    }

    if (game.value === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw notFound()
    }

    const gameState = kbGameStateType(game.value)

    if (gameState instanceof type.errors) {
      throwError({
        message: gameState.summary,
        type: 'InvalidGameState'
      })
    }

    return gameState
  })

// to be used client side
export const getGameForUserFn = createServerFn({ method: 'GET' })
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
    return prepareGameState(
      await getGameFn({ data }),
      context.session.session.userId
    )
  })
