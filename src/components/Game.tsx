import { useGame } from '~/hooks/useGame'
import { HowToPlayModal } from './HowToPlay'
import { Loading } from './Loading'
import { PlayerOneBoard, PlayerTwoBoard } from './PlayerBoard'
import { QRCodeModal } from './QRCode'
import { SideBarActions } from './SideBar'

export function Game() {
  const game = useGame()
  // const isOnMobile = useIsOnMobile()

  if (game.status === 'waiting') {
    return <Loading />
  }

  // const { errorMessage, clearErrorMessage } = gameStore

  // Pas tip top je trouve, mais virtuellement ça marche
  // const gameOutcome = <GameOutcome />

  return (
    <>
      <SideBarActions>
        <HowToPlayModal />
        <QRCodeModal />
        {/* <OutcomeHistory /> */}
        {/* {isOnMobile && gameOutcome} */}
      </SideBarActions>
      <div className='flex flex-col items-center justify-around'>
        <PlayerTwoBoard />
        {/* {!isOnMobile && gameOutcome} */}
        <PlayerOneBoard />
        {/* <WarningToast message={errorMessage} onDismiss={clearErrorMessage} /> */}
      </div>
    </>
  )
}
