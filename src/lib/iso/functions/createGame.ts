import { type } from 'arktype'
import { ResultAsync } from 'neverthrow'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { GameStateWithDb } from '~/lib/server/business/GameStateWithDb'
import { db } from '~/lib/server/db'
import { parseDbError, throwError } from '~/lib/server/db/utils'
import { kbGame } from '~/lib/server/schemas'
import { kbGameInsertSchema } from '../../server/types'
import { Ai } from '../business/Ai'
import { delayPlay } from '../utils/delayPlay'
import { authMiddleware } from './middlewares'

const createSchema = kbGameInsertSchema.pick('boType', 'difficulty').partial()

export const createGameFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: unknown) => {
    const parsed = createSchema(data)
    if (parsed instanceof type.errors) {
      throw new Error(parsed.summary)
    }
    return parsed
  })
  .handler(async ({ data, context }) => {
    const { boType = 'free_play', difficulty } = data
    const againstAI = difficulty !== undefined && difficulty !== null
    const userId = context.session.session.userId

    const gameResult = await ResultAsync.fromPromise(
      db
        .insert(kbGame)
        .values({
          boType,
          difficulty
          // embedded in the join logic, which is clearer to read, but this below
          // saves an update (though it's done using batch)
          // status: againstAI ? 'playing' : 'waiting'
        })
        .returning(),
      parseDbError
    ).map((data) => data[0])

    if (gameResult.isErr()) {
      throwError(gameResult.error)
    }

    const gameState = new GameStateWithDb({ ...gameResult.value, players: [] })

    const result = await ResultAsync.fromPromise(
      gameState.joinIfPossible(
        userId,
        againstAI ? process.env.AI_1_USER_ID : undefined
      ),
      parseDbError
    )

    if (result.isErr()) {
      throwError(result.error)
    }

    const doesAiStarts = gameState.nextPlayerUserId === process.env.AI_1_USER_ID
    if (gameState.isAgainstAi && doesAiStarts) {
      delayPlay(async () => {
        const ai = new Ai(gameState, process.env.AI_1_USER_ID!)
        const move = ai.suggestNextPlay()
        await gameState.play(process.env.AI_1_USER_ID!, move.column)
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-throw-literal
    throw redirect({
      to: `/game/$id`,
      params: {
        id: gameState.toJson.id
      }
    })
  })
