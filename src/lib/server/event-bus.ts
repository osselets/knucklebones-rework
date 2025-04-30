import { EventEmitter } from 'node:events'
import { type KbGameState } from '../iso/types/kbGame'

// I'll strictly type the event bus for the game state, naming it like GameStateEventBus
// and sessionId should probably be the gameId
export class GameStateEventBus {
  private static instance?: GameStateEventBus
  private readonly emitter: EventEmitter

  private constructor() {
    this.emitter = new EventEmitter()
    this.emitter.setMaxListeners(0)
  }

  public static getInstance(): GameStateEventBus {
    if (GameStateEventBus.instance === undefined) {
      GameStateEventBus.instance = new GameStateEventBus()
    }
    return GameStateEventBus.instance
  }

  public subscribe(gameId: string, callback: (event: KbGameState) => void) {
    this.emitter.on(gameId, callback)
  }

  public unsubscribe(gameId: string, callback: (event: KbGameState) => void) {
    this.emitter.off(gameId, callback)
  }

  public publish(gameId: string, gameState: KbGameState) {
    this.emitter.emit(gameId, gameState)
  }
}
