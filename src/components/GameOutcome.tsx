import { useTranslation } from 'react-i18next'
import { PlayIcon } from '@heroicons/react/24/outline'
import { t } from 'i18next'
import { useGameState } from '~/hooks/useGame'
import { type ClientGameState } from '~/new-common'
import { useIsOnDesktop } from '../hooks/detectDevice'
import { Button } from './Button'
import { useGame, type InGameContext } from './GameContext'
import { ShortcutModal } from './ShortcutModal'

// function getWinMessage(gameState: ClientGameState) {
//   if (!gameState.hasRoundEnded) {
//     if (winner !== undefined) {
//       const gameScope = outcome === 'round-ended' ? 'round' : 'game'
//       const playerWin = winner.isPlayerOne ? 'you-win' : 'opponent-win'
//       return t(`game.${gameScope}.${playerWin}` as const, {
//         player: winner.inGameName,
//         points: winner.score
//       })
//     }
//     return t(outcome === 'round-ended' ? 'game.round.tie' : 'game.game.tie')
//   }
//   return ''
// }

interface VoteButtonProps extends Pick<InGameContext, 'boType' | 'outcome'> {
  hasVoted: boolean
  onRematch(): void
  onContinue(): void
  onContinueIndefinitely(): void
}

function VoteButtons({ gameState }: { gameState: ClientGameState }) {
  const { t } = useTranslation()

  const onContinue = () => {
    console.log('continue')
  }
  const onContinueIndefinitely = () => {
    console.log('continue free_play')
  }
  const onRematch = () => {
    console.log('rematch')
  }

  return null
  // if (boType !== 'free_play') {
  //   if (outcome === 'round-ended') {
  //     return (
  //       <Button onClick={onContinue} disabled={hasVoted}>
  //         {t('game.continue')}
  //       </Button>
  //     )
  //   }
  //   if (outcome === 'game-ended') {
  //     return (
  //       <div className='flex flex-col items-center gap-2 md:flex-row'>
  //         <Button onClick={onRematch} disabled={hasVoted}>
  //           {t('game.rematch')}
  //         </Button>
  //         <Button onClick={onContinueIndefinitely} disabled={hasVoted}>
  //           {t('game.go-free-play')}
  //         </Button>
  //       </div>
  //     )
  //   }
  // }
  // return (
  //   <Button onClick={onRematch} disabled={hasVoted}>
  //     {t('game.rematch')}
  //   </Button>
  // )
}

export function GameOutcome() {
  const gameState = useGameState()!
  const isOnDesktop = useIsOnDesktop()
  const { t } = useTranslation()

  const hasCurrentPlayerVoted = gameState.currentPlayer!.voteFor !== undefined
  const hasOpponentVoted = gameState.opponent!.voteFor !== undefined

  if (gameState.hasRoundEnded) {
    // On peut mettre un VS semi-transparent dans le fond de la partie
    // pour rappeler cet élément sans pour autant que ça prenne de l'espace dans
    // le layout.
    return <p className='hidden lg:block'>VS</p>
  }

  const content = (
    <div className='grid justify-items-center gap-2 font-semibold'>
      {/* <p>{getWinMessage({ outcome, winner })}</p> */}

      {!gameState.isSpectator && <VoteButtons gameState={gameState} />}

      {/* should be in a component */}
      {!gameState.isSpectator &&
        (hasCurrentPlayerVoted ? (
          <p>
            {t('game.waiting-rematch', { player: gameState.opponent?.userId })}
          </p>
        ) : (
          hasOpponentVoted && ( // It means the other player has voted for rematch
            <p>
              {t('game.opponent-rematch', {
                player: gameState.opponent?.userId
              })}
            </p>
          )
        ))}
    </div>
  )

  if (isOnDesktop) {
    return content
  }

  return (
    <ShortcutModal
      icon={<PlayIcon />}
      label={t('game.continue')}
      isInitiallyOpen
    >
      {content}
    </ShortcutModal>
  )
}
