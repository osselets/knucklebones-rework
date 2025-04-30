import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
  primaryKey,
  type AnyPgColumn,
  uuid
} from 'drizzle-orm/pg-core'
import { user } from './auth'

// OR we can just have a document table (no-sql like) that stores the whole
// game state as a json. not sure which one is more relevant.
// technically, it would be the same amount of read/write, but having proper
// tables, we can index them and query them easily.

export const boTypeEnum = pgEnum('bo_type', ['free_play', '1', '3', '5'])
export const gameStatusEnum = pgEnum('game_status', [
  'waiting',
  'playing',
  'finished'
])
export const difficultyEnum = pgEnum('difficulty', ['easy', 'medium', 'hard'])

export const kbGame = pgTable('kb_game', {
  id: uuid().defaultRandom().primaryKey(),
  boType: boTypeEnum('bo_type').notNull(),
  status: gameStatusEnum('status').notNull().default('waiting'),
  previousGameId: uuid('previous_game_id').references(
    (): AnyPgColumn => kbGame.id
  ),
  difficulty: difficultyEnum('difficulty'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
})

export const kbGamePlayer = pgTable(
  'kb_game_player',
  {
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    gameId: uuid('game_id')
      .references(() => kbGame.id, {
        onDelete: 'cascade'
      })
      .notNull(),
    board: text('board').notNull().default('[[],[],[]]'),
    // we used to store the score per column, should we do this again?
    // why do we store the score actually? quick way to know who won from the db
    // otherwise, we can compute the score per column client side, that's fine
    score: integer('score').notNull().default(0),
    rematch: boolean('rematch').notNull().default(false),
    dieToPlay: integer('dice_to_play'),
    // could be needed if we ever want to play with more than 2 players
    // order: integer("order").notNull().default(0),
    // not sure these are relevant for this table
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow()
  },
  (table) => [primaryKey({ columns: [table.userId, table.gameId] })]
)

// only needed when using `db.query` for relation mapping

export const kbGamePlayerRelations = relations(kbGamePlayer, ({ one }) => ({
  game: one(kbGame, { fields: [kbGamePlayer.gameId], references: [kbGame.id] }),
  user: one(user, { fields: [kbGamePlayer.userId], references: [user.id] })
}))
export const kbGameRelations = relations(kbGame, ({ many, one }) => ({
  players: many(kbGamePlayer),
  previousGame: one(kbGame, {
    fields: [kbGame.previousGameId],
    references: [kbGame.id]
  })
}))
