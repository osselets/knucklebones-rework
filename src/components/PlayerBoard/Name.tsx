interface NameProps {
  name: string
}

// will be removed in favor of a profile page to edit name
export function Name({ name }: NameProps) {
  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      <p className='break-all text-center'>
        {name}
        {/* TODO: bring back You later */}
        {/* {isEditable && ` (${t('game.you')})`} */}
      </p>
    </div>
  )
}
