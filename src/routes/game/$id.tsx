import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '~/components/AppLayout'
import { Game } from '~/components/Game'
import { gameQueryOptions } from '~/hooks/useGame'
import { joinGameFn } from '~/lib/iso/functions/join'

export const Route = createFileRoute('/game/$id')({
  component: GamePage,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  beforeLoad: async ({ params }) => {
    await joinGameFn({ data: params.id })
  },
  loader: async ({ params, context }) => {
    await context.queryClient.ensureQueryData(gameQueryOptions(params.id))
  }
})

function GamePage() {
  return (
    <AppLayout>
      <Game />
    </AppLayout>
  )
}
