import { getRandomIntInclusive } from '~/common'

export function delayPlay(play: () => Promise<void>) {
  const [min, max] =
    import.meta.env.MODE === 'development' ? [1000, 2000] : [500, 1000]
  const ms = getRandomIntInclusive(min, max)
  setTimeout(() => {
    void play()
  }, ms)
}
