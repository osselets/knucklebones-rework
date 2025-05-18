import { type MutationCtx } from '~/_generated/server'
import { type GenericCtx } from './types'

export function checkCanMutate(ctx: GenericCtx): asserts ctx is MutationCtx {
  if (!('runMutation' in ctx)) {
    throw new Error('Cannot mutate without a mutation context')
  }
}
