import { useGameState } from '~/hooks/useGame'
import { PlayerBoard } from './Board'

export function PlayerTwoBoard() {
  const gameState = useGameState()!
  const player = gameState.opponent!
  const isPlayerTurn = gameState.nextPlayerUserId === player.userId

  return (
    <PlayerBoard
      columns={player.board}
      die={player.dieToPlay ?? undefined}
      score={player.score}
      scorePerColumn={player.scorePerColumn}
      position='top'
      canPlay={false}
      isPlayerTurn={isPlayerTurn}
    />
  )
}
