export type Difficulty = 'easy' | 'medium' | 'hard'
export type BoType = 'free_play' | 1 | 3 | 5
export type PlayerType = 'human' | 'ai'

export interface GameSettings {
  playerType: PlayerType
  boType: BoType
  difficulty?: Difficulty
}
