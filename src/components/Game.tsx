import { useIsOnMobile } from '~/hooks/detectDevice'
import { useGameState } from '~/hooks/useGame'
import { GameOutcome } from './GameOutcome'
import { HowToPlayModal } from './HowToPlay'
import { Loading } from './Loading'
import { PlayerOneBoard, PlayerTwoBoard } from './PlayerBoard'
import { QRCodeModal } from './QRCode'
import { SideBarActions } from './SideBar'

export function Game() {
  const gameState = useGameState()
  const isOnMobile = useIsOnMobile()

  if (gameState === null || gameState.isWaiting) {
    return <Loading />
  }

  // const { errorMessage, clearErrorMessage } = gameStore

  // Pas tip top je trouve, mais virtuellement ça marche
  const gameOutcome = <GameOutcome />

  return (
    <>
      <SideBarActions>
        <HowToPlayModal />
        <QRCodeModal />
        {/* <OutcomeHistory /> */}
        {isOnMobile && gameOutcome}
      </SideBarActions>
      <div className='flex flex-col items-center justify-around'>
        <PlayerTwoBoard />
        {!isOnMobile && gameOutcome}
        <PlayerOneBoard />
        {/* <WarningToast message={errorMessage} onDismiss={clearErrorMessage} /> */}
      </div>
    </>
  )
}
