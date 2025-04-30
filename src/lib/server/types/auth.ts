import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema
} from 'drizzle-arktype'
import { user } from '../schemas'

export const userSelectSchema = createSelectSchema(user)
export type UserSelect = typeof userSelectSchema.infer
export const userInsertSchema = createInsertSchema(user)
export type UserInsert = typeof userInsertSchema.infer
export const userUpdateSchema = createUpdateSchema(user)
export type UserUpdate = typeof userUpdateSchema.infer
