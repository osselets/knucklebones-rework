// there's some issue with vite and the package not correctly exporting ESM files
// i'll ignore this for now as it can still render client side,
// but the `import RU from 'react-use'` doesn't seem to work
import { useMedia } from 'react-use'

export function useIsOnDesktop() {
  return useMedia('(min-width: 1024px)', false)
}
export function useIsOnMobile() {
  return !useIsOnDesktop()
}
