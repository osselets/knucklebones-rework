import { useGameState } from '~/hooks/useGame'
import { PlayerBoard } from './Board'

export function PlayerTwoBoard() {
  const gameState = useGameState()!
  const opponent = gameState.opponent!
  const isPlayerTurn = gameState.nextPlayerUserId === opponent.userId

  return (
    <PlayerBoard
      columns={opponent.board}
      die={opponent.dieToPlay ?? undefined}
      position='top'
      canPlay={false}
      isPlayerTurn={isPlayerTurn}
    />
  )
}
