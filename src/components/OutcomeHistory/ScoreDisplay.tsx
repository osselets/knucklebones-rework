import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { type GameOutcome } from '~/common'
import { type PlayerSide } from '../../utils/player'
import { type InGameContext } from '../GameContext'
import { Text } from '../Text'

interface ScoreDisplayProps extends GameOutcome, Pick<InGameContext, 'boType'> {
  playerSide: PlayerSide
}

export function ScoreDisplay({
  boType,
  playerOne,
  playerTwo,
  playerSide
}: ScoreDisplayProps) {
  const { t } = useTranslation()
  const score = (
    <>
      <span
        className={clsx({
          'font-semibold': playerSide === 'player-one'
        })}
      >
        {playerOne.wins}
      </span>{' '}
      -{' '}
      <span
        className={clsx({
          'font-semibold': playerSide === 'player-two'
        })}
      >
        {playerTwo.wins}
      </span>
    </>
  )

  if (boType === 'indefinite') {
    return <Text>{score}</Text>
  }

  const currentRound = Math.min(playerOne.wins + playerTwo.wins + 1, boType)

  return (
    <Text>
      {t('menu.history.label', { current: currentRound, boType })} ({score})
    </Text>
  )
}
