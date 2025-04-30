import { createFileRoute } from '@tanstack/react-router'
import { AppLayout } from '~/components/AppLayout'
import { HowToPlayPage } from '~/components/HowToPlay'

export const Route = createFileRoute('/how-to-play')({
  component: RouteComponent
})

function RouteComponent() {
  return (
    <AppLayout>
      <HowToPlayPage />
    </AppLayout>
  )
}
