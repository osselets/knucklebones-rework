import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '~/components/AppLayout'
import { HomePage } from '~/components/HomePage'

export const Route = createFileRoute('/')({
  component: Home,
  // loader: async ({ context }) => {
  //   await context.queryClient.ensureQueryData(tokenQueryOptions)
  // },
  ssr: false
})

function Home() {
  // AppLayout should be in _root but it messes up things
  return (
    <AppLayout>
      <HomePage />
    </AppLayout>
  )
}
