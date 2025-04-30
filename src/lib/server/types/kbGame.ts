import {
  createSelectSchema,
  createInsertSchema,
  createUpdateSchema
} from 'drizzle-arktype'
import { kbGame, kbGamePlayer } from '../schemas'

// add specific validation
export const kbGameSelectSchema = createSelectSchema(kbGame)
export type KbGameSelect = typeof kbGameSelectSchema.infer
export const kbGameInsertSchema = createInsertSchema(kbGame)
export type KbGameInsert = typeof kbGameInsertSchema.infer
export const kbGameUpdateSchema = createUpdateSchema(kbGame)
export type KbGameUpdate = typeof kbGameUpdateSchema.infer

// add specific validation, around dice, board, etc.
export const kbGamePlayerSelectSchema = createSelectSchema(kbGamePlayer)
export type KbGamePlayerSelect = typeof kbGamePlayerSelectSchema.infer
export const kbGamePlayerInsertSchema = createInsertSchema(kbGamePlayer)
export type KbGamePlayerInsert = typeof kbGamePlayerInsertSchema.infer
export const kbGamePlayerUpdateSchema = createUpdateSchema(kbGamePlayer)
export type KbGamePlayerUpdate = typeof kbGamePlayerUpdateSchema.infer
