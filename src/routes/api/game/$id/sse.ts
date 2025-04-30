import { createAPIFileRoute } from '@tanstack/react-start/api'
import { getEvent } from '@tanstack/react-start/server'
import { type } from 'arktype'
import { type KbGameState, kbGameStateType } from '~/lib/iso/types/kbGame'
import { prepareGameState } from '~/lib/iso/utils/prepareGameState'
import { auth } from '~/lib/server/auth'
import { jsonError } from '~/lib/server/db'
import { GameStateEventBus } from '~/lib/server/event-bus'

export const APIRoute = createAPIFileRoute('/api/game/$id/sse')({
  GET: async ({ request, params }) => {
    const sessionId = params.id
    const event = getEvent()
    const session = await auth.api.getSession({
      headers: request.headers
    })
    const userId = session?.session.userId
    if (userId === undefined) {
      return jsonError({
        message: 'User id is not provided',
        type: 'Unauthenticated'
      })
    }

    const stream = new ReadableStream({
      start(controller) {
        const eventBus = GameStateEventBus.getInstance()
        const encoder = new TextEncoder()
        const send = (message: string) => {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`))
        }

        // Subscribe to session-specific events
        const handleSessionEvent = (gameState: KbGameState) => {
          console.log('send', userId)
          send(JSON.stringify(prepareGameState(gameState, userId)))
        }
        eventBus.subscribe(sessionId, handleSessionEvent)

        // Handle client disconnection
        event.node.req.on('close', () => {
          eventBus.unsubscribe(sessionId, handleSessionEvent)
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      }
    })
  },
  // Note: have this protected by a server side secret
  POST: async ({ request, params }) => {
    const sessionId = params.id
    const eventBus = GameStateEventBus.getInstance()

    const body = await request.json()
    const gameState = kbGameStateType(body)

    if (gameState instanceof type.errors) {
      return jsonError({
        type: 'InvalidGameState',
        message: gameState.summary
      })
    }
    console.log('valid', gameState)

    eventBus.publish(sessionId, gameState)
    return new Response(null, { status: 204, statusText: 'OK' })
  }
})
