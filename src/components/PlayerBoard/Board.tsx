import { useTranslation } from 'react-i18next'
import { clsx } from 'clsx'
import { type IPlayer, countDiceInColumn, type Outcome } from '~/common'
import { Dice } from '../Dice'
import { Cell } from './Cell'
import { Column } from './Column'
import { ColumnScoreTooltip } from './ColumnScore'
import { Name } from './Name'

interface BoardProps {
  columns: number[][]
  position: 'top' | 'bottom'
  /** Serves to allow user interaction, when the user is playing on that board */
  canPlay: boolean
  diceClassName?: string
  onColumnClick?(colIndex: number): void
}

interface PlayerBoardProps extends BoardProps {
  die?: number
  score?: number
  scorePerColumn?: number[]
  /** Serves to indicate which player should play, whether the current user is a spectator or not */
  isPlayerTurn: boolean
}

const MAX_COLUMNS = 3
const MAX_CELLS_PER_COLUMNS = 3

const COLUMNS_PLACEHOLDER = Array.from({ length: MAX_COLUMNS })
const CELLS_PER_COLUMN_PLACEHOLDER = Array.from({
  length: MAX_CELLS_PER_COLUMNS
})

export function Board({
  columns,
  canPlay,
  position,
  diceClassName,
  onColumnClick
}: BoardProps) {
  return (
    <div
      className={clsx(
        'grid aspect-square grid-cols-3 divide-x-2 divide-slate-300 rounded-lg bg-transparent shadow-lg shadow-slate-300 dark:divide-slate-800 dark:shadow-slate-800',
        {
          'opacity-75': !canPlay
        }
      )}
    >
      {COLUMNS_PLACEHOLDER.map((_, colIndex) => {
        const column = columns[colIndex]
        const countedDice = countDiceInColumn(column)
        const canPlayInColumn = canPlay && column.length < MAX_CELLS_PER_COLUMNS
        return (
          <Column
            key={colIndex}
            readonly={!canPlayInColumn}
            onClick={
              canPlayInColumn ? () => onColumnClick?.(colIndex) : undefined
            }
          >
            {CELLS_PER_COLUMN_PLACEHOLDER.map((_, cellIndex) => {
              // Reverses the render order to mirror the board for the other player
              const actualCellIndex =
                position === 'top'
                  ? MAX_CELLS_PER_COLUMNS - cellIndex - 1
                  : cellIndex
              const value = column[actualCellIndex]
              return (
                <Cell key={cellIndex}>
                  <Dice
                    value={value}
                    count={countedDice.get(value)}
                    className={diceClassName}
                  />
                </Cell>
              )
            })}
          </Column>
        )
      })}
    </div>
  )
}

export function PlayerBoard({
  die,
  position,
  score = 0,
  scorePerColumn = [0, 0, 0],
  columns = [[], [], []],
  canPlay,
  isPlayerTurn,
  onColumnClick
}: PlayerBoardProps) {
  const { t } = useTranslation()
  const isTop = position === 'top'
  const isBottom = position === 'bottom'
  return (
    <div
      className={clsx('flex items-center gap-1 md:gap-4', {
        'flex-col': isBottom,
        'flex-col-reverse': isTop,
        'font-semibold': isPlayerTurn
      })}
    >
      <Name name='' />
      <div
        className={clsx('grid grid-cols-3-central gap-4 md:gap-8', {
          'items-end': isBottom,
          'items-start': isTop
        })}
      >
        <div className='my-4'>
          <Dice
            value={die}
            // showUndefined={isNextPlayer}
          />
        </div>
        <div
          className={clsx('flex items-center gap-1 md:gap-4', {
            'flex-col': isBottom,
            'flex-col-reverse': isTop
          })}
        >
          <div className='grid w-full grid-cols-3'>
            {scorePerColumn.map((score, index) => (
              <ColumnScoreTooltip
                score={score}
                dice={columns[index]}
                position={position}
                key={index}
              />
            ))}
          </div>
          <Board
            position={position}
            canPlay={canPlay && isPlayerTurn}
            columns={columns}
            onColumnClick={onColumnClick}
          />
        </div>
        <div className='my-4'>
          <p>
            {t('game.total')}: {score}
          </p>
        </div>
      </div>
    </div>
  )
}
