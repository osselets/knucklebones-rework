import {
  countDiceInColumn,
  getColumnScore,
  getMaxBy,
  getMinBy,
  sortBy
} from '~/common'
import { type KbGameState, type KbGamePlayer } from '../types/kbGame'
import { shouldNeverHappen } from '../utils/shouldNeverHappen'
import { type GameState } from './GameState'

interface WeightedPlay {
  gain: number
  risk: number
  score: number
  column: number
}

type Strategy = 'defensive' | 'offensive'

export class Ai {
  private readonly gameState: KbGameState
  private readonly ai: KbGamePlayer
  private readonly human: KbGamePlayer

  constructor(gameState: GameState, aiUserId: string) {
    const { player: ai, opponent: human } = gameState.getPlayers(aiUserId)
    // meh?
    this.gameState = gameState.toJson
    this.ai = ai
    this.human = human
  }

  public suggestNextPlay() {
    const weightedPlays = this.weighPossiblePlays()

    if (this.ai.score > this.human.score) {
      return this.getRecommendedPlay(weightedPlays, 'defensive')
    } else {
      return this.getRecommendedPlay(weightedPlays, 'offensive')
    }
  }

  private getRecommendedPlay(
    weightedPlays: WeightedPlay[],
    strategy: Strategy
  ): WeightedPlay {
    const sortedWeightedPlays = sortBy(weightedPlays, 'score', 'ascending')
    // Defaults when there's not enough plays (e.g. column is full)
    const [easy, medium = easy, hard = medium] = sortedWeightedPlays

    let recommendedPlay: WeightedPlay

    switch (this.gameState.difficulty) {
      case 'easy':
        recommendedPlay = easy
        break
      case 'medium':
        recommendedPlay = medium
        break
      case 'hard':
        recommendedPlay = hard
        break
      default:
        shouldNeverHappen(
          'GameStateWithAi should always be used for games with a set difficulty'
        )
    }

    const duplicatePlays = weightedPlays.filter(
      (value) => value.score === recommendedPlay.score
    )

    if (duplicatePlays.length > 1) {
      if (strategy === 'offensive') {
        return getMaxBy(duplicatePlays, 'gain')
      } else {
        return getMinBy(duplicatePlays, 'risk')
      }
    } else {
      return recommendedPlay
    }
  }

  private weighPossiblePlays(): WeightedPlay[] {
    const weightedPlays: WeightedPlay[] = []

    this.ai.board.forEach((_, column) => {
      if (this.ai.board[column].length < 3) {
        weightedPlays.push(this.weighPlayInColumn(column))
      }
    })

    return weightedPlays
  }

  private weighPlayInColumn(column: number): WeightedPlay {
    const gain = this.evaluateGainInColumn(column)
    const risk = this.evaluateRiskInColumn(column)
    const score = gain - risk

    return { gain, risk, score, column }
  }

  private evaluateGainInColumn(column: number): number {
    const aiColumn = this.ai.board[column]

    if (aiColumn.length === 3) {
      return 0
    }

    const aiNewColumn = aiColumn.concat(
      this.ai.dieToPlay ??
        shouldNeverHappen(
          'AI should have a die to play when calling this method'
        )
    )

    const aiScore = getColumnScore(aiColumn)
    const aiNewScore = getColumnScore(aiNewColumn)

    const aiScoreDifference = aiNewScore - aiScore

    const humanColumn = this.human.board[column]
    const humanNewColumn = humanColumn.filter(
      (diceToRemove) => diceToRemove !== this.ai.dieToPlay
    )

    const humanScore = getColumnScore(humanColumn)
    const humanNewScore = getColumnScore(humanNewColumn)

    const humanScoreDifference = humanScore - humanNewScore

    const openSlots = 2 - aiColumn.length

    return aiScoreDifference + humanScoreDifference + openSlots
  }

  private evaluateRiskInColumn(column: number): number {
    const riskFromDiceInAiColumn = this.getMaxInMapValues(
      countDiceInColumn(this.ai.board[column])
    )
    const riskFromOpenSlotsInHumanColumn = 3 - this.human.board[column].length
    const riskFromScoreDifference = this.compareScores(column)

    return (
      riskFromDiceInAiColumn +
      riskFromOpenSlotsInHumanColumn +
      riskFromScoreDifference
    )
  }

  private getMaxInMapValues(map: Map<number, number>) {
    let max = 0

    map.forEach((value) => {
      if (value > max) {
        max = value
      }
    })

    return max
  }

  private compareScores(column: number) {
    const aiScore = getColumnScore(this.ai.board[column])
    const humanScore = getColumnScore(this.human.board[column])

    if (aiScore > humanScore) {
      return 1
    } else if (aiScore < humanScore) {
      return -1
    } else {
      return 0
    }
  }
}
