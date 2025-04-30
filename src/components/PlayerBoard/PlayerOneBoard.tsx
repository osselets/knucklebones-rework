import { useServerFn } from '@tanstack/react-start'
import { useGame } from '~/hooks/useGame'
import { playFn } from '~/lib/iso/functions/play'
import { PlayerBoard } from './Board'

// TODO: Create a PlayerBoard component which takes in a Player and userType
// derives everything from these info and import a server function to play
// playerOneBoard and playerTwoBoard can be removed, there will be a simple
// check within the component

// actually, for now, we can keep PlayerOneBoard and PlayerTwoBoard, implement
// them, and we'll see later if it is relevant to merge them (for other game
// modes, it will actually be relevant to have something generic)

// read the comments in Board.tsx and PlayerTwoBoard.tsx for more info

export function PlayerOneBoard() {
  const { playerOne, userType, id } = useGame()
  const play = useServerFn(playFn)

  const isPlayerTurn = playerOne.dieToPlay !== null
  const isSpectator = userType === 'spectator'

  return (
    <PlayerBoard
      columns={playerOne.board}
      die={playerOne.dieToPlay ?? undefined}
      position='bottom'
      onColumnClick={
        isPlayerTurn
          ? (column) => {
              void play({
                data: {
                  column,
                  gameId: id
                }
              })
            }
          : undefined
      }
      canPlay={!isSpectator}
      isPlayerTurn={isPlayerTurn}
    />
  )
}
