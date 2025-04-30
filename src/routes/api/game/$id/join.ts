import { createAPIFileRoute } from '@tanstack/react-start/api'
import { eq } from 'drizzle-orm'
import { json } from '@tanstack/react-start'
import { db } from '~/lib/server/db'
import { kbGamePlayer } from '~/lib/server/schemas'

// later i'll need a wait to leave a game (when we'll have 2+ players per game),
// and the host has to start the game, people can leave while game status is waiting
export const APIRoute = createAPIFileRoute('/api/game/$id/join')({
  POST: async ({ request, params }) => {
    const players = await db
      .select()
      .from(kbGamePlayer)
      .where(eq(kbGamePlayer.gameId, params.id))

    if (players.length === 0) {
      // I'll assume that the game doesn't exist if there are no players
      return json({ error: 'Game not found' }, { status: 404 })
    }

    const canJoin =
      players.length < 2 && !players.some((p) => p.userId === 'user-1')

    // idk yet if i'm fetching and returning the whole game state here, or leaving
    // it in /game/$id to be done in a subsequent request. could be more performant.
    // actually, since i'll need to propagate an event via SSE, i'll need to get
    // the whole game state at some point. the apis don't know the whole gamestate
    // when an action is sent, so they will have to fetch it. thus, either the
    // SSE is responsible for this, or the endpoints.
    if (canJoin) {
      await db
        .insert(kbGamePlayer)
        .values({ gameId: params.id, userId: 'user-1' })
      return new Response(null, { status: 201 })
    }

    return new Response(null, { status: 204 })
  }
})
