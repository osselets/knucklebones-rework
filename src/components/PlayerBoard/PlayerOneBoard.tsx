import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { api } from '~/convex/api'
import { type Id } from '~/convex/dataModel'
import { useGameState } from '~/hooks/useGame'
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
  // useGameStateOnGoing?
  const gameState = useGameState()!
  const player = gameState.currentPlayer!
  const isPlayerTurn = player.shouldPlayNext && !gameState.hasRoundEnded
  console.log({ isPlayerTurn })

  const { mutate } = useMutation({
    mutationFn: useConvexMutation(api.kbGame.play)
  })

  return (
    <PlayerBoard
      columns={player.board}
      die={player.dieToPlay ?? undefined}
      position='bottom'
      score={player.score}
      scorePerColumn={player.scorePerColumn}
      onColumnClick={
        isPlayerTurn
          ? (column) => {
              mutate({
                gameId: gameState.gameId as Id<'kb_games'>,
                column
              })
            }
          : undefined
      }
      canPlay={!gameState.isSpectator}
      isPlayerTurn={isPlayerTurn}
    />
  )
}
