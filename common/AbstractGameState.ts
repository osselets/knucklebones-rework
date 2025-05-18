/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { type PlayerOptions, type Player, type VoteType } from './Player'

export type BoType = 'free_play' | '1' | '3' | '5'
export type Difficulty = 'easy' | 'medium' | 'hard' | null

export type Game = {
  readonly _id: string // convex system field
  baseGameId: string | null
  boType: BoType
  status: 'waiting' | 'playing' | 'finished'
  difficulty: Difficulty
  modificationTime: number
}

export type PlayerGeneratorOptions = Pick<PlayerOptions, 'gameId' | 'userId'>

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

  // #region public accessors and state describers

  public get gameId() {
    return this.game._id
  }

  public get boType() {
    return this.game.boType
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

  public get hasRoundEnded() {
    return (
      this.game.status === 'finished' || this.players.some((p) => p.IsBoardFull)
    )
  }

  public get roundWinner() {
    if (
      !this.hasRoundEnded ||
      this.currentPlayer === undefined ||
      this.opponent === undefined
    )
      return null

    if (this.currentPlayer.score === this.opponent.score) {
      return 'draw'
    }

    return this.currentPlayer.score > this.opponent.score
      ? this.currentPlayer
      : this.opponent
  }

  public get hasGameEnded() {
    if (this.game.boType === 'free_play') {
      return this.hasRoundEnded
    }

    const numberOfRounds = Number(this.game.boType)
    const maxWin = Math.ceil(numberOfRounds / 2)
    const scores = this.getHistoryScores()
    const highestScore = Math.max(scores.currentPlayer, scores.opponent)
    const maxScoreReached = highestScore === maxWin

    return this.hasRoundEnded && maxScoreReached
  }

  public get gameWinner() {
    if (
      !this.hasGameEnded ||
      this.currentPlayer === undefined ||
      this.opponent === undefined
    )
      return null

    const scores = this.getHistoryScores()

    return scores.currentPlayer > scores.opponent
      ? this.currentPlayer
      : this.opponent
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
    return this.players.find((player) => player.shouldPlayNext)?.userId
  }

  public get toJson() {
    return {
      game: this.game,
      players: this.players.map((p) => p.toJson)
    }
  }

  // #endregion public accessors and state describers

  // #region internal accessors

  protected get shouldStartGame() {
    return this.players.length === 2
  }

  protected get canCurrentUserJoin() {
    return this.players.length <= 2 && this.currentPlayer === undefined
  }

  protected get shouldProceedWithVote() {
    return this.currentPlayer!.voteFor === this.opponent!.voteFor
  }

  // #endregion internal accessors

  // #region public actions

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

    const placedDie = this.currentPlayer.dieToPlay!
    this.currentPlayer.addDice(column)
    this.opponent.removeDice(placedDie, column)
    this.opponent.giveDie()

    if (this.hasRoundEnded) {
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
    this.currentPlayer!.voteFor(voteType)

    // why not do the same thing as join?
    if (this.isAgainstAi) {
      this.opponent!.voteFor(voteType)
    }

    if (this.shouldProceedWithVote) {
      this.setupNextGameState(voteType)
    }
  }

  // #endregion public actions

  // #region internal utils

  protected addPlayer(userId: string) {
    if (!this.canUserJoin(userId)) return

    const date = new Date()

    const player = this.generatePlayer({ userId, gameId: this.gameId })
    this.players.push(player)

    if (this.shouldStartGame) {
      const firstPlayerIndex = Math.round(Math.random())
      this.players[firstPlayerIndex].giveDie()

      this.game.status = 'playing'
      this.game.modificationTime = date.valueOf()
    }
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

  // takes the current game in account
  protected getHistoryScores() {
    return this.history.concat(this).reduce(
      (acc, curr) => {
        if (curr.roundWinner === null && curr.roundWinner === 'draw') return acc
        if (curr.roundWinner === curr.currentPlayer) acc.currentPlayer++
        if (curr.roundWinner === curr.opponent) acc.opponent++
        return acc
      },
      { currentPlayer: 0, opponent: 0 }
    )
  }

  private setupNextGameState(voteType: VoteType) {
    const nextGameState = this.generateNextGameState(this.currentUserId)

    // protected properties can be accessed from instances of the same class
    // ported to TS from C#: https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/protected#example-2
    nextGameState.game.difficulty = this.game.difficulty
    nextGameState.join()
    nextGameState.addOpponent(this.opponent!.userId)

    this.nextGameState = nextGameState

    // end of a BO game, we don't want to keep the same base game id
    if (this.hasGameEnded && this.boType !== 'free_play') {
      nextGameState.game.boType =
        voteType === 'rematch' ? this.game.boType : 'free_play'
      return
    }

    nextGameState.game.boType = this.game.boType
    nextGameState.game.baseGameId = this.gameId
  }

  // #endregion internal utils

  // #region internal generators
  // this pattern ensures that the base class can generate players, games and
  // new state while using generics so that each sub-class can have different
  // sub types

  protected abstract generatePlayer(options: PlayerGeneratorOptions): TPlayer

  protected abstract generateGame(): TGame

  protected abstract generateNextGameState(
    userId: string
  ): AbstractGameState<TGame, TPlayer>

  // #endregion internal generators
}
