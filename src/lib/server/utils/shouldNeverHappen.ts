// https://x.com/schickling/status/1910011932276379776
export function shouldNeverHappenInServer(
  message?: string,
  ...args: any[]
): never {
  console.error(message, ...args)
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-debugger
    debugger
  }

  throw new Error(`This should never happen: ${message}`)
}
