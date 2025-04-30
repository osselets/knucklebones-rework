import { DrizzleError } from 'drizzle-orm'
import { type BatchItem } from 'drizzle-orm/batch'
import { NeonDbError } from '@neondatabase/serverless'
import { json } from '@tanstack/react-start'

// https://github.com/drizzle-team/drizzle-orm/discussions/2520
// instead of doing this, we do something like cond ? operation : db.execute('select 1');
export function operations<
  U extends BatchItem<'pg'> | false,
  T extends Readonly<[U, ...U[]]>
>(args: T) {
  return args.filter((operation) => operation !== false) as [
    Exclude<U, false>,
    ...Array<Exclude<U, false>>
  ]
}

interface ErrorResponse {
  type: string
  message: string
  detail?: string
  stack?: string
}

export function parseDbError(error: unknown): ErrorResponse {
  if (error instanceof NeonDbError) {
    return {
      detail: error.detail,
      type: error.name,
      message: 'An error occurred with the database',
      stack: error.stack
    }
  }
  if (error instanceof DrizzleError) {
    return {
      detail: error.message,
      type: error.name,
      message: 'An error occurred with the database',
      stack: error.stack
    }
  }
  if (error instanceof Error) {
    return {
      type: 'Unexpected',
      message: 'Unexpected error occurred',
      stack: error.stack
    }
  }
  return {
    type: 'Unexpected',
    message: 'Unexpected error occurred'
  }
}

export function returnError(error: ErrorResponse) {
  console.error(error)
  if (import.meta.env.PROD) {
    return {
      message: error.message
    }
  }
  return error
}

export function jsonError(error: ErrorResponse) {
  return json({ error }, { status: 400 })
}

// should probably create a custom error class for this
// TODO: take in a result from neverthrow, and only throw when there's an error
// so that it can be used like this in server functions:
// const result = await ResultAsync()
// throwIfError(result)
// result.value ...
// or
// const value = unwrapOrThrow(result)
export function throwError(error: ErrorResponse): never {
  throw new Error(error.message, error as any)
}
