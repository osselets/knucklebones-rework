import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useConvexMutation } from '@convex-dev/react-query'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { type Difficulty, type PlayerType } from '~/common'
import { api } from '~/convex/api'
import { Button } from '../Button'
import { Modal, type ModalProps } from '../Modal'
import { type Option, ToggleGroup } from '../ToggleGroup'
import {
  getBoTypeOptions,
  getDifficultyOptions,
  type StringBoType
} from './options'

interface GameSettingProps<T> {
  label: string
  options: Array<Option<T>>
  value: T
  onValueChange(value: T): void
}

function GameSetting<T>({
  label,
  options,
  value,
  onValueChange
}: GameSettingProps<T>) {
  return (
    <div className='grid grid-cols-1 gap-2'>
      <label className='text-lg md:text-xl'>{label}</label>
      {/* Accessibility? */}
      <ToggleGroup
        mandatory
        type='single'
        size='medium'
        options={options}
        value={String(value)}
        onValueChange={(value) => {
          onValueChange(value as T)
        }}
      />
    </div>
  )
}

interface GameSettingsProps extends ModalProps {
  playerType?: PlayerType
}

export function GameSettingsModal({
  playerType,
  ...modalProps
}: GameSettingsProps) {
  const [difficulty, setDifficulty] = React.useState<Difficulty>('medium')
  const [boType, setBoType] = React.useState<StringBoType>('free_play')
  const { t } = useTranslation()

  const navigate = useNavigate()
  const { mutate } = useMutation({
    mutationFn: useConvexMutation(api.kbGame.createGame),
    async onSuccess(gameId) {
      await navigate({
        to: `/game/$id`,
        params: { id: gameId as string }
      })
    },
    onError(error) {
      console.error('Error creating game:', error)
      // Handle the error appropriately, e.g., show an error message to the user.
    }
  })

  return (
    <Modal {...modalProps}>
      <Modal.Title>{t('game-settings.title')}</Modal.Title>
      <div className='grid grid-cols-1 gap-8'>
        {playerType === 'ai' && (
          <GameSetting
            label={t('game-settings.difficulty.label')}
            value={difficulty}
            onValueChange={setDifficulty}
            options={getDifficultyOptions()}
          />
        )}
        <GameSetting
          label={t('game-settings.games.label')}
          value={boType}
          onValueChange={setBoType}
          options={getBoTypeOptions()}
        />
        <Button
          size='medium'
          onClick={() => {
            mutate({
              boType,
              difficulty: playerType === 'ai' ? difficulty : null
            })
          }}
        >
          {t('game-settings.start')}
        </Button>
      </div>
    </Modal>
  )
}
