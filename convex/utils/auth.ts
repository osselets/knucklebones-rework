import {
  customQuery,
  customMutation,
  customCtx
} from 'convex-helpers/server/customFunctions'
import {
  type QueryCtx,
  type MutationCtx,
  query,
  mutation
} from '../_generated/server'

export async function checkAuth(ctx: QueryCtx | MutationCtx) {
  const user = await ctx.auth.getUserIdentity()
  if (user === null) {
    throw new Error('User not authenticated')
  }
}

export async function getUserIdOrThrow(ctx: QueryCtx | MutationCtx) {
  const user = await ctx.auth.getUserIdentity()
  if (user === null) {
    throw new Error('User not authenticated')
  }
  return user.subject
}

// https://stack.convex.dev/custom-functions#modifying-the-ctx-argument-to-a-server-function-for-user-auth
export const userQuery = customQuery(
  query,
  customCtx(async (ctx) => {
    const user = await ctx.auth.getUserIdentity()
    if (user === null) {
      throw new Error('User not authenticated')
    }
    const userId = user.subject
    return { userId }
  })
)
export const userMutation = customMutation(
  mutation,
  customCtx(async (ctx) => {
    return { userId: await getUserIdOrThrow(ctx) }
  })
)
