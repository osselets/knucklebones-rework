/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {
  AbstractGameState,
  type GameStateOptions,
  type Game,
  type PlayerGeneratorOptions
} from './AbstractGameState'
import { Player, type PlayerOptions } from './Player'

export type GameStateJsonOptions = {
  /** game may not exist, as when creating a new game */
  game?: Game
  players: PlayerOptions[]
  userId: string
  history?: GameStateJsonOptions[]
}

// as it's purely client side, this may be moved to the client side code?
// though it's not really client, it's agnostic
// + it should return gameId as Id<'kb_games'>
export class ClientGameState extends AbstractGameState<Game, Player> {
  // #region instantiators

  constructor({
    game,
    players,
    userId,
    history = []
  }: GameStateOptions<Game, Player>) {
    super({
      game,
      players,
      userId,
      history
    })
  }

  public static fromJson({
    userId,
    game,
    players,
    history
  }: GameStateJsonOptions): ClientGameState {
    return new ClientGameState({
      userId,
      game,
      players: players.map((p) => new Player(p)),
      history: history?.map((g) => ClientGameState.fromJson(g))
    })
  }

  // #endregion instantiators

  // #region internal generators

  protected override generatePlayer(options: PlayerGeneratorOptions): Player {
    return new Player(options)
  }

  protected override generateGame(): Game {
    return {
      _id: 'TO BE SET',
      boType: 'free_play',
      difficulty: null,
      status: 'waiting',
      baseGameId: null,
      modificationTime: Date.now()
    }
  }

  protected override generateNextGameState(userId: string): ClientGameState {
    return new ClientGameState({
      userId,
      game: this.generateGame(),
      players: [],
      history: []
    })
  }

  // #endregion internal generators
}
