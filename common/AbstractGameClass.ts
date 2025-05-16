/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { getRandomDice } from './random'
import { getTotalScore } from './score'

export type BoType = 'free_play' | '1' | '3' | '5'
export type Difficulty = 'easy' | 'medium' | 'hard' | null
export type VoteType = 'rematch' | 'continue' | null

export type Game = {
  readonly _id: string // convex system field
  baseGameId: string | null
  boType: BoType
  status: 'waiting' | 'playing' | 'finished'
  difficulty: Difficulty
  modificationTime: number
}

export type Player = {
  userId: string
  gameId: string
  board: number[][]
  score: number
  voteFor: VoteType
  dieToPlay: number | null
  modificationTime: number
}

export type GameStateOptions<TGame extends Game, TPlayer extends Player> = {
  /** game may not exist, as when creating a new game */
  game?: TGame
  players: TPlayer[]
  userId: string
  history?: Array<AbstractGameState<TGame, TPlayer>>
}

export type CreateGameStateOptions = {
  userId: string
  boType: BoType
  difficulty: Difficulty
  history?: Array<AbstractGameState<Game, Player>>
}

// Note: would be nice to have a NotReadyGameState and a ReadyGameState, to assert
// things around players (avoid possibly undefined)

// TODO: use neverthrow?
export abstract class AbstractGameState<
  TGame extends Game,
  TPlayer extends Player
> {
  // all these are readonly as they should not be mutated once a game is created
  // the underlying properties or elements may change
  protected readonly game: TGame
  protected readonly players: TPlayer[]
  protected readonly currentUserId: string
  protected readonly history: Array<AbstractGameState<TGame, TPlayer>>
  protected nextGameState?: AbstractGameState<TGame, TPlayer>

  constructor({
    game = this.generateGame(),
    players,
    userId,
    history = []
  }: GameStateOptions<TGame, TPlayer>) {
    this.game = game
    this.players = players
    this.currentUserId = userId
    this.history = history
  }

  // accessors and state describers

  public get gameId() {
    return this.game._id
  }

  // until there's not enough player to start the game, nobody will be considered
  // as spectator, as they could be players
  public get isSpectator() {
    return (
      this.game.status !== 'waiting' &&
      !this.players.some((p) => p.userId === this.currentUserId)
    )
  }

  // For spectators, since they aren't in the player list, we just assign
  // currentPlayer and opponent based on index. Later, we could control that
  // to spectate any player side.
  public get currentPlayer() {
    if (this.isSpectator) {
      return this.players[0]
    }
    return this.players.find((player) => player.userId === this.currentUserId)
  }

  public get opponent() {
    if (this.isSpectator) {
      return this.players[1]
    }
    return this.players.find((player) => player.userId !== this.currentUserId)
  }

  public get hasEnded() {
    return (
      this.game.status === 'finished' ||
      this.players.some((p) => this.IsBoardFull(p.board))
    )
  }

  public get isWaiting() {
    return this.game.status === 'waiting'
  }

  public get isOngoing() {
    return this.game.status === 'playing'
  }

  public get isAgainstAi() {
    return this.game.difficulty !== null
  }

  public get nextPlayerUserId() {
    return this.players.find((player) => player.dieToPlay !== null)?.userId
  }

  public get winner() {
    if (
      !this.hasEnded ||
      this.currentPlayer === undefined ||
      this.opponent === undefined
    )
      return null

    return this.currentPlayer.score > this.opponent.score
      ? this.currentPlayer
      : this.opponent
  }

  public get toJson() {
    return {
      game: this.game,
      players: this.players
    }
  }

  protected get shouldStartGame() {
    return this.players.length === 2
  }

  protected get canCurrentUserJoin() {
    return this.players.length <= 2 && this.currentPlayer === undefined
  }

  protected get shouldProceedWithVote() {
    return this.currentPlayer!.voteFor === this.opponent!.voteFor
  }

  // actions

  public play(column: number) {
    if (!this.isOngoing) {
      throw new Error('Game is not active')
    }

    if (this.opponent === undefined || this.currentPlayer === undefined) {
      // shouldNeverHappenInServer(
      //   'There should always be an opponent while game is ongoing'
      // )
      throw new Error(
        'There should always be two players while game is ongoing'
      )
    }

    const dieToPlay = this.currentPlayer.dieToPlay
    if (dieToPlay === null) {
      throw new Error("It is not player's turn")
    }

    if (this.currentPlayer.board[column].length === 3) {
      throw new Error('Cannot place a die in a full column')
    }

    this.currentPlayer.board[column].push(dieToPlay)
    this.currentPlayer.score = getTotalScore(this.currentPlayer.board)

    this.opponent.board[column] = this.opponent.board[column].filter(
      (die) => die !== dieToPlay
    )
    this.opponent.score = getTotalScore(this.currentPlayer.board)

    this.currentPlayer.dieToPlay = null
    this.opponent.dieToPlay = getRandomDice()

    if (this.hasEnded) {
      this.game.status = 'finished'
      this.game.modificationTime = Date.now()
    }
  }

  public join() {
    this.addPlayer(this.currentUserId)
  }

  public addOpponent(userId: string) {
    this.addPlayer(userId)
  }

  public voteFor(voteType: VoteType) {
    const modificationTime = new Date().valueOf()
    this.currentPlayer!.voteFor = voteType
    this.currentPlayer!.modificationTime = modificationTime

    // why not do the same thing as join?
    if (this.isAgainstAi) {
      this.opponent!.voteFor = voteType
      this.opponent!.modificationTime = modificationTime
    }

    if (this.shouldProceedWithVote) {
      const nextGameState = this.generateNextGameState(this.currentUserId)

      // protected properties can be accessed from instances of the same class
      // ported to TS from C#: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/protected#example-2
      nextGameState.game.boType =
        voteType === 'rematch' ? this.game.boType : 'free_play'
      nextGameState.game.difficulty = this.game.difficulty
      nextGameState.addOpponent(this.opponent!.userId)

      this.nextGameState = nextGameState
    }
  }

  // Utils

  protected addPlayer(userId: string) {
    if (!this.canUserJoin(userId)) return

    const date = new Date()

    const player = this.generatePlayer()
    player.userId = this.currentUserId
    player.gameId = this.gameId
    player.modificationTime = date.valueOf()
    this.players.push(player)

    if (this.shouldStartGame) {
      this.setFirstPlayer()
      this.game.status = 'playing'
      this.game.modificationTime = date.valueOf()
    }
  }

  protected setFirstPlayer() {
    if (this.players.length !== 2) {
      throw new Error('Game must have 2 players')
    }

    const firstPlayerIndex = Math.round(Math.random())
    const dieToPlay = getRandomDice()

    this.players[firstPlayerIndex].dieToPlay = dieToPlay
  }

  protected canUserJoin(userId: string) {
    return (
      this.players.length <= 2 &&
      !this.players.some((player) => player.userId === userId)
    )
  }

  protected IsBoardFull(board: number[][]) {
    // 3 columns x 3 rows = 9 dice
    return board.flat().length === 9
  }

  // internal generators
  // this pattern ensures that the base class can generate players, games and
  // new state while using generics so that each sub-class can have different
  // sub types

  protected abstract generatePlayer(): TPlayer

  protected abstract generateGame(): TGame

  protected abstract generateNextGameState(
    userId: string
  ): AbstractGameState<TGame, TPlayer>
}

// // #region
// export default ClientGameState
// // #endregion
