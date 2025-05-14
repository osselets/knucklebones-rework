import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '~/components/AppLayout'
import { Game } from '~/components/Game'

export const Route = createFileRoute('/game/$id')({
  component: GamePage,
  head: () => ({ meta: [{ name: 'robots', content: 'noindex' }] }),
  // could use HTTP endpoints here: https://docs.convex.dev/http-api/#api-authentication
  // beforeLoad: async ({ params }) => {
  //   await joinGameFn({ data: params.id })
  // },
  // not sure how I have to pass the token during SSR
  // best shot but not helpful: https://docs.convex.dev/client/react/nextjs/server-rendering#server-side-authentication
  // perhaps I have to make sure the auth convex context is set? perhaps I can inject it in convexClient
  // loader: async ({ params, context }) => {
  // yeah could use that I guess
  // context.convexQueryClient.convexClient.setAuth
  // await context.queryClient.ensureQueryData(
  //   convexQuery(api.kbGame.getGame, { gameId: params.id as Id<'kb_games'> })
  // )
  // },
  ssr: false
})

function GamePage() {
  return (
    <AppLayout>
      <Game />
    </AppLayout>
  )
}
