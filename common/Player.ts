/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { getRandomDice } from './random'
import { getColumnScore, getTotalScore } from './score'

export type VoteType = 'rematch' | 'continue' | null

export type PlayerOptions = {
  userId: string
  gameId: string
  board?: number[][]
  score?: number
  votedFor?: VoteType
  dieToPlay?: number | null
  modificationTime?: number
}

export class Player {
  protected readonly _userId: string
  protected readonly gameId: string
  protected _board: number[][]
  protected votedFor: VoteType
  protected _dieToPlay: number | null
  protected modificationTime: number

  constructor({
    userId,
    gameId,
    board = [[], [], []],
    votedFor = null,
    dieToPlay = null,
    modificationTime = Date.now()
  }: PlayerOptions) {
    this._userId = userId
    this.gameId = gameId
    this._board = board
    this.votedFor = votedFor
    this._dieToPlay = dieToPlay
    this.modificationTime = modificationTime
  }

  // #region public accessors

  public get userId() {
    return this._userId
  }

  public get board() {
    return this._board
  }

  // or isTheirTurn?
  public get shouldPlayNext() {
    return this.dieToPlay !== null
  }

  public get hasVoted() {
    return this.votedFor !== null
  }

  public get score() {
    return getTotalScore(this.board)
  }

  public get scorePerColumn() {
    return this.board.map((column) => {
      return getColumnScore(column)
    })
  }

  public get dieToPlay() {
    return this._dieToPlay
  }

  public get IsBoardFull() {
    // 3 columns x 3 rows = 9 dice
    return this.board.flat().length === 9
  }

  public get toJson() {
    return {
      userId: this.userId,
      gameId: this.gameId,
      board: this.board,
      score: this.score,
      votedFor: this.votedFor,
      dieToPlay: this.dieToPlay,
      modificationTime: this.modificationTime
    }
  }

  // #endregion public accessors

  // #region public actions

  public addDice(column: number) {
    // shouldPlayNext doesn't provide a type guard
    if (this.dieToPlay === null) {
      throw new Error("It is not player's turn")
    }

    if (column < 0 || column > 2) {
      throw new Error('Invalid column. Value must be between 0 and 2.')
    }

    if (this.board[column].length >= 3) {
      throw new Error("Can't add die in column because it's already full.")
    }

    this.board[column].push(this.dieToPlay)
    this._dieToPlay = null
    this.modificationTime = Date.now()
  }

  public removeDice(die: number, column: number) {
    if (column < 0 || column > 2) {
      throw new Error('Invalid column. Value must be between 0 and 2.')
    }

    this.board[column] = this.board[column].filter(
      (existingDie) => existingDie !== die
    )
    this.modificationTime = Date.now()
  }

  public giveDie() {
    if (this.dieToPlay !== null) {
      throw new Error("It was player's turn")
    }

    this._dieToPlay = getRandomDice()
    this.modificationTime = Date.now()
  }

  public voteFor(voteType: VoteType) {
    this.votedFor = voteType
    this.modificationTime = Date.now()
  }

  // #endregion public actions
}
