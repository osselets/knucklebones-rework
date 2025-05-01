import { defineConfig } from '@tanstack/react-start/config'
import { cloudflare } from 'unenv'
import tsConfigPaths from 'vite-tsconfig-paths'

// may be cleaner to use the deny imports from vite-env-only, especially since
// i'm already splitting the lib folders into client, server, and iso
// https://www.npmjs.com/package/vite-env-only

export default defineConfig({
  // https://github.com/TanStack/router/discussions/2863?sort=new#discussioncomment-12458714
  tsr: {
    appDirectory: './src'
  },
  vite: {
    plugins: [
      tsConfigPaths({
        projects: ['./tsconfig.json']
      })
    ]
  },
  server: {
    preset: 'cloudflare-pages',
    unenv: cloudflare
  }
})
