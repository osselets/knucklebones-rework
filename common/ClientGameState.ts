import {
  AbstractGameState,
  type GameStateOptions,
  type Game,
  type Player
} from './AbstractGameClass'

// as it's purely client side, this may be moved to the client side code?
// though it's not really client, it's agnostic
export class ClientGameState extends AbstractGameState<Game, Player> {
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

  protected override generatePlayer(): Player {
    return {
      userId: 'TO BE SET',
      gameId: 'TO BE SET',
      board: [[], [], []],
      score: 0,
      voteFor: null,
      dieToPlay: null,
      modificationTime: Date.now()
    }
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
}
