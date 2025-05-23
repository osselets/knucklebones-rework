// https://x.com/schickling/status/1910011932276379776
export function shouldNeverHappenInClient(
  message?: string,
  ...args: any[]
): never {
  console.error(message, ...args)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-debugger
    debugger
  }

  throw new Error(`This should never happen: ${message}`)
}
