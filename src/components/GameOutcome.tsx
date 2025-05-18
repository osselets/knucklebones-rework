import { useTranslation } from 'react-i18next'
import { PlayIcon } from '@heroicons/react/24/outline'
import { t } from 'i18next'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { api } from '~/convex/api'
import { type Id } from '~/convex/dataModel'
import { useGameState } from '~/hooks/useGame'
import { type ClientGameState } from '~/new-common'
import { useIsOnDesktop } from '../hooks/detectDevice'
import { Button } from './Button'
import { ShortcutModal } from './ShortcutModal'

function getWinMessage(gameState: ClientGameState) {
  // not the end of the round
  if (!gameState.hasRoundEnded || gameState.roundWinner === null) return ''

  // round ended in a draw
  if (gameState.roundWinner === 'draw') return t('game.round.tie')

  // game ended with the round end
  if (gameState.hasGameEnded && gameState.gameWinner !== null) {
    const playerWin =
      gameState.gameWinner === gameState.currentPlayer
        ? 'you-win'
        : 'opponent-win'
    return t(`game.game.${playerWin}` as const, {
      player: gameState.gameWinner.userId,
      points: gameState.gameWinner.score
    })
  }

  // not the end of the game
  const playerWin =
    gameState.roundWinner === gameState.currentPlayer
      ? 'you-win'
      : 'opponent-win'
  return t(`game.round.${playerWin}` as const, {
    player: gameState.roundWinner.userId,
    points: gameState.roundWinner.score
  })
}

function VoteButtons({ gameState }: { gameState: ClientGameState }) {
  const { t } = useTranslation()
  const hasVoted = gameState.currentPlayer!.hasVoted
  console.log(hasVoted, gameState.currentPlayer)

  const { mutate } = useMutation({
    mutationFn: useConvexMutation(api.kbGame.voteRematchGame)
  })

  const onContinue = () => {
    mutate({ gameId: gameState.gameId as Id<'kb_games'>, voteType: 'continue' })
  }
  const onContinueIndefinitely = () => {
    mutate({ gameId: gameState.gameId as Id<'kb_games'>, voteType: 'continue' })
  }
  const onRematch = () => {
    mutate({ gameId: gameState.gameId as Id<'kb_games'>, voteType: 'rematch' })
  }

  if (gameState.boType !== 'free_play') {
    if (gameState.hasRoundEnded) {
      return (
        <Button onClick={onContinue} disabled={hasVoted}>
          {t('game.continue')}
        </Button>
      )
    }
    if (gameState.hasGameEnded) {
      return (
        <div className='flex flex-col items-center gap-2 md:flex-row'>
          <Button onClick={onRematch} disabled={hasVoted}>
            {t('game.rematch')}
          </Button>
          <Button onClick={onContinueIndefinitely} disabled={hasVoted}>
            {t('game.go-free-play')}
          </Button>
        </div>
      )
    }
  }
  return (
    <Button onClick={onRematch} disabled={hasVoted}>
      {t('game.rematch')}
    </Button>
  )
}

export function GameOutcome() {
  const gameState = useGameState()!
  const isOnDesktop = useIsOnDesktop()
  const { t } = useTranslation()

  const hasCurrentPlayerVoted = gameState.currentPlayer!.voteFor !== undefined
  const hasOpponentVoted = gameState.opponent!.voteFor !== undefined

  if (!gameState.hasRoundEnded) {
    // On peut mettre un VS semi-transparent dans le fond de la partie
    // pour rappeler cet élément sans pour autant que ça prenne de l'espace dans
    // le layout.
    return <p className='hidden lg:block'>VS</p>
  }

  const content = (
    <div className='grid justify-items-center gap-2 font-semibold'>
      <p>{getWinMessage(gameState)}</p>

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
