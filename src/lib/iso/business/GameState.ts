import { getRandomDice } from '~/common'
import { type KbGameState } from '../types/kbGame'
import { prepareGameState } from '../utils/prepareGameState'
import { shouldNeverHappen } from '../utils/shouldNeverHappen'

// TODO: use neverthrow
export class GameState {
  protected readonly gameState: KbGameState

  constructor(gameState: KbGameState) {
    this.gameState = gameState
  }

  public get hasEnded() {
    return (
      this.gameState.status === 'finished' ||
      this.gameState.players.some((p) => this.IsBoardFull(p.board))
    )
  }

  public get isOngoing() {
    return this.gameState.status === 'playing'
  }

  public get isAgainstAi() {
    return this.gameState.difficulty !== null
  }

  public get toJson() {
    return this.gameState
  }

  public get nextPlayerUserId() {
    return this.gameState.players.find((player) => player.dieToPlay !== null)
      ?.userId
  }

  // meh, prepareGameState should be removed
  public toPrepared(userId: string) {
    return prepareGameState(this.gameState, userId)
  }

  protected get shouldStartGame() {
    return this.gameState.players.length === 2
  }

  public play(userId: string, column: number) {
    if (!this.isOngoing) {
      throw new Error('Game is not active')
    }

    const { player, opponent } = this.getPlayers(userId)

    if (opponent === undefined) {
      shouldNeverHappen(
        'There should always be an opponent while game is ongoing'
      )
    }

    const dieToPlay = player.dieToPlay
    if (dieToPlay === null) {
      throw new Error("It is not player's turn")
    }

    if (player.board[column].length === 3) {
      throw new Error('Cannot place a die in a full column')
    }

    player.board[column].push(dieToPlay)
    opponent.board[column] = opponent.board[column].filter(
      (die) => die !== dieToPlay
    )

    player.dieToPlay = null
    opponent.dieToPlay = getRandomDice()

    // add end logic
  }

  public joinIfPossible(userId: string, aiUserId?: string) {
    if (!this.canJoin(userId)) {
      return
    }
    const date = new Date()

    // default values from `lib/server/schemas/kbGame.ts`
    this.gameState.players.push({
      userId,
      gameId: this.gameState.id,
      board: [[], [], []],
      score: 0,
      rematch: false,
      updatedAt: date,
      createdAt: date,
      dieToPlay: null,
      user: {
        name: ''
      }
    })

    if (aiUserId !== undefined) {
      this.gameState.players.push({
        userId: aiUserId,
        gameId: this.gameState.id,
        board: [[], [], []],
        score: 0,
        rematch: false,
        updatedAt: date,
        createdAt: date,
        dieToPlay: null,
        user: {
          name: ''
        }
      })
    }

    if (this.shouldStartGame) {
      this.setFirstPlayer()
      this.gameState.status = 'playing'
      this.gameState.updatedAt = date
    }
  }

  protected canJoin(userId: string) {
    return (
      this.gameState.players.length < 2 &&
      !this.gameState.players.some((p) => p.userId === userId)
    )
  }

  protected setFirstPlayer() {
    if (this.gameState.players.length !== 2) {
      throw new Error('Game must have 2 players')
    }

    const firstPlayerIndex = Math.round(Math.random())
    const dieToPlay = getRandomDice()

    this.gameState.players[firstPlayerIndex].dieToPlay = dieToPlay
  }

  public getPlayers(userId: string) {
    const player = this.gameState.players.find(
      (player) => player.userId === userId
    )
    if (player === undefined) {
      throw new Error('Player not found in game')
    }
    const opponent = this.gameState.players.find(
      (player) => player.userId !== userId
    )

    return {
      player,
      opponent
    }
  }

  protected IsBoardFull(board: number[][]) {
    // 3 columns x 3 rows = 9 dice
    return board.flat().length === 9
  }
}
