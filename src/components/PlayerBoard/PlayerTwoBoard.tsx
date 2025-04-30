import { useGame } from '~/hooks/useGame'
import { PlayerBoard } from './Board'

export function PlayerTwoBoard() {
  const { playerTwo } = useGame()

  const isPlayerTurn = playerTwo.dieToPlay !== null

  return (
    <PlayerBoard
      columns={playerTwo.board}
      die={playerTwo.dieToPlay ?? undefined}
      position='top'
      canPlay={false}
      isPlayerTurn={isPlayerTurn}
    />
  )
}
