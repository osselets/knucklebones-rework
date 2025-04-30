import { createAPIFileRoute } from '@tanstack/react-start/api'
import { type } from 'arktype'
import { sql } from 'drizzle-orm'
import { json } from '@tanstack/react-start'
import { db } from '~/lib/server/db'
import { kbGame, kbGamePlayer } from '~/lib/server/schemas'
import { kbGameInsertSchema } from '~/lib/server/types'

const paramsSchema = type({
  boType: kbGameInsertSchema.get('boType').optional()
})

export const APIRoute = createAPIFileRoute('/api/game/$id/rematch')({
  POST: async ({ request, params }) => {
    const parsedParams = paramsSchema(params)
    if (parsedParams instanceof type.errors) {
      return json(
        { error: parsedParams.summary },
        {
          status: 400
        }
      )
    }

    const gameState = await db.query.kbGame.findFirst({
      where: (kbGame, { eq }) => eq(kbGame.id, params.id),
      with: {
        players: true
      }
    })

    if (gameState === undefined) {
      return json({ error: 'Game not found' }, { status: 404 })
    }

    if (gameState.status !== 'finished') {
      return json({ error: 'Game is not finished' }, { status: 400 })
    }

    if (
      gameState.players.some(
        (player) => player.userId === 'user-1' && player.rematch
      )
    ) {
      return json(
        { error: 'You have already voted for rematch' },
        { status: 400 }
      )
    }

    const votingPlayers = gameState.players.filter((player) => player.rematch)

    // prevents writing when vote has been set
    // though, there's no vote to not continue, you just don't vote
    // so having the rematch being a nullable boolean doesn't make sense
    await db.update(kbGamePlayer).set({ rematch: true, updatedAt: new Date() })
      .where(sql`
      ${kbGamePlayer.gameId} = ${params.id} AND
      ${kbGamePlayer.userId} = 'user-1'`)

    // the other player hasn't voted yet
    if (votingPlayers.length === 0) {
      return new Response(null, { status: 201 })
    }

    // create a new game with the same settings

    const newGame = (
      await db
        .insert(kbGame)
        .values({
          boType: parsedParams.boType ?? gameState.boType,
          difficulty: gameState.difficulty,
          previousGame: gameState.id
        })
        .returning()
    )[0]

    await db.insert(kbGamePlayer).values([
      {
        gameId: newGame.id,
        userId: 'user-1'
      },
      {
        gameId: newGame.id,
        userId: 'user-2'
      }
    ])

    return new Response(null, { status: 201 })
  }
})
