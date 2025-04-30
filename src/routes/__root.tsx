import type { ReactNode } from 'react'
import { type QueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  type ErrorComponentProps
} from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import appCss from '../index.css?url'

interface Context {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<Context>()({
  head: () => ({
    meta: [
      {
        title: 'Knucklebones | From Cult of the Lamb'
      },
      {
        charSet: 'utf-8'
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1'
      },
      {
        name: 'description',
        // I guess that can be translated in place? worst case that can be done
        // in different files (/fr/index.tsx)
        content:
          'Discover Knucklebones, a fan-made online dice game from Cult of the Lamb. Play against AI or friends for free. Unofficial but thrilling and addictive multiplayer fun awaits!'
      },
      {
        name: 'og:title',
        content: 'Knucklebones | From Cult of the Lamb'
      },
      {
        name: 'og:type',
        content: 'website'
      },
      {
        name: 'og:url',
        content: '/'
      },
      {
        name: 'og:description',
        content: '/public/og-image.png'
      },
      {
        name: 'twitter:card',
        content: 'summary_large_image'
      }
    ],
    links: [
      {
        rel: 'alternate',
        hrefLang: 'fr',
        href: 'https://knucklebones.io/fr/'
      },
      {
        rel: 'alternate',
        hrefLang: 'en',
        href: 'https://knucklebones.io/en/'
      },
      {
        rel: 'alternate',
        hrefLang: 'x-default',
        href: 'https://knucklebones.io/en/'
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/public/apple-touch-icon.png'
      },
      { rel: 'icon', sizes: '32x32', href: '/public/favicon-32x32.png' },
      { rel: 'icon', sizes: '16x16', href: '/public/favicon-16x16.png' },
      { rel: 'manifest', href: '/public/site.webmanifest' },
      { rel: 'stylesheet', href: appCss },
      {
        rel: 'preload',
        href: '/public/Mona-Sans.woff2',
        as: 'front',
        type: 'font/woff2'
      },
      {
        rel: 'preload',
        href: '/public/Hubot-Sans.woff2',
        as: 'front',
        type: 'font/woff2'
      }
    ],
    // it may be better to store the selected theme in cookies and use that in SSR
    scripts: [{ src: '/public/theme.js' }]
  }),
  component: RootComponent,
  errorComponent: ErrorComponent
})

function ErrorComponent(props: ErrorComponentProps) {
  console.log(props.error, props.info)
  return (
    <div className='text-red-500'>
      <h1>Something went wrong</h1>
      <p>{props.error.message}</p>
      <pre>{JSON.stringify(props.error, null, 2)}</pre>
    </div>
  )
}

function RootComponent() {
  return (
    <RootDocument>
      <>
        {/* should use AppLayout here but cannot because of `useMedia` */}
        {/* <AppLayout> */}
        <Outlet />
        {/* </AppLayout> */}
        <TanStackRouterDevtools />
        <ReactQueryDevtools />
      </>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
