/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { getRandomDice } from './random'
import { getTotalScore } from './score'

export type BoType = 'free_play' | '1' | '3' | '5'
export type Difficulty = 'easy' | 'medium' | 'hard' | null

export type Game = {
  readonly _id: string // convex system field
  boType: BoType
  status: 'waiting' | 'playing' | 'finished'
  difficulty: Difficulty
  // previousGameId: string | null
  modificationTime: number
}

export type Player = {
  userId: string
  gameId: string
  board: number[][]
  score: number
  rematch: boolean
  dieToPlay: number | null
  modificationTime: number
}

export type GameStateOptions<TGame extends Game, TPlayer extends Player> = {
  game: TGame
  players: TPlayer[]
  userId: string
  generatePlayer(): TPlayer
}

export type CreateGameStateOptions = {
  userId: string
  boType: BoType
  difficulty: Difficulty
}

export function generatePlayer(): Player {
  const date = new Date()
  return {
    userId: 'TO BE SET',
    gameId: 'TO BE SET',
    board: [[], [], []],
    score: 0,
    rematch: false,
    dieToPlay: null,
    modificationTime: date.valueOf()
  }
}

// Note: would be nice to have a NotReadyGameState and a ReadyGameState, to assert
// things around players (avoid possibly undefined)

// TODO: use neverthrow?
export class GameState<
  TGame extends Game = Game,
  TPlayer extends Player = Player
> {
  protected readonly game: TGame
  protected readonly players: TPlayer[]
  protected readonly currentUserId: string
  // need this to avoid Typescript issue around `this.players.push` using generics
  // and allow for `GameStateWithDb` to handle some Convex specific stuff for players
  protected readonly generatePlayer: () => TPlayer

  // instanciators

  constructor({
    game,
    players,
    userId,
    generatePlayer
  }: GameStateOptions<TGame, TPlayer>) {
    this.game = game
    this.players = players
    this.currentUserId = userId
    this.generatePlayer = generatePlayer
  }

  static createGame({ boType, difficulty, userId }: CreateGameStateOptions) {
    return new GameState({
      game: {
        _id: 'TO BE SET',
        boType,
        difficulty,
        status: 'waiting',
        modificationTime: Date.now()
      },
      players: [],
      userId,
      generatePlayer
    })
  }

  static createDefaultGameState({
    game,
    players,
    userId
  }: Omit<GameStateOptions<Game, Player>, 'generatePlayer'>) {
    return new GameState({ game, players, userId, generatePlayer })
  }

  // state describers

  // until there's not enough player to start the game, nobody will be considered
  // as spectator, as they could be players
  public get isSpectator() {
    return (
      this.players.length === 2 &&
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

  public get isOngoing() {
    return this.game.status === 'playing'
  }

  public get isAgainstAi() {
    return this.game.difficulty !== null
  }

  public get toJson() {
    return {
      game: this.game,
      players: this.players
    }
  }

  public get nextPlayerUserId() {
    return this.players.find((player) => player.dieToPlay !== null)?.userId
  }

  protected get shouldStartGame() {
    return this.players.length === 2
  }

  protected get canUserJoin() {
    return !this.isSpectator && this.currentPlayer === undefined
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

  public joinIfPossible(aiUserId?: string) {
    if (!this.canUserJoin) return

    const date = new Date()

    const player = this.generatePlayer()
    player.userId = this.currentUserId
    player.gameId = this.game._id
    player.modificationTime = date.valueOf()
    this.players.push(player)

    if (aiUserId !== undefined) {
      const aiPlayer = this.generatePlayer()
      aiPlayer.userId = aiUserId
      aiPlayer.gameId = this.game._id
      aiPlayer.modificationTime = date.valueOf()
      this.players.push(aiPlayer)
    }

    if (this.shouldStartGame) {
      this.setFirstPlayer()
      this.game.status = 'playing'
      this.game.modificationTime = date.valueOf()
    }
  }

  // Utils

  protected setFirstPlayer() {
    if (this.players.length !== 2) {
      throw new Error('Game must have 2 players')
    }

    const firstPlayerIndex = Math.round(Math.random())
    const dieToPlay = getRandomDice()

    this.players[firstPlayerIndex].dieToPlay = dieToPlay
  }

  protected IsBoardFull(board: number[][]) {
    // 3 columns x 3 rows = 9 dice
    return board.flat().length === 9
  }
}
