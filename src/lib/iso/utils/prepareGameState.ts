import {
  kbGamePlayer,
  kbGameStateType,
  type KbGameState
} from '../types/kbGame'

export const preparedGameStateType = kbGameStateType.and({
  playerOne: kbGamePlayer,
  playerTwo: kbGamePlayer,
  userType: '"player"| "spectator"'
})

export type PreparedGameState = typeof preparedGameStateType.infer

export function prepareGameState(
  gameState: KbGameState,
  currentUserId: string
): PreparedGameState {
  const _playerIndex = gameState.players.findIndex(
    (p) => p.userId === currentUserId
  )

  const isSpectator = _playerIndex === -1
  const playerIndex = isSpectator ? 0 : _playerIndex

  // will be changed later to something else, like allies[] and opponents[]
  const playerOne = gameState.players[playerIndex]
  const playerTwo = gameState.players[playerIndex === 0 ? 1 : 0]

  console.log({ playerOne, playerTwo })

  return {
    ...gameState,
    playerOne,
    playerTwo,
    userType: isSpectator ? 'spectator' : 'player'
  }
}
