import { ResultAsync } from 'neverthrow'
import { FetchError } from 'ofetch'
import { type KbGameState } from '../iso/types/kbGame'
import { api } from './api'

// could also rename /sse into /sync
export function syncGameState(gameState: KbGameState) {
  return ResultAsync.fromPromise(
    api(`/game/${gameState.id}/sse`, {
      method: 'POST',
      body: gameState
    }),
    (error) => {
      if (error instanceof FetchError) {
        return {
          detail: error.data,
          type: error.name,
          message: 'An error occurred with the database',
          stack: error.stack
        }
      }

      return {
        type: 'Unexpected',
        message: 'Unexpected error occurred'
      }
    }
  )
}
