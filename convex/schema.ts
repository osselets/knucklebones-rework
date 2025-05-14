import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export const boType = v.union(
  v.literal('free_play'),
  v.literal('1'),
  v.literal('3'),
  v.literal('5')
)
export const difficulty = v.union(
  v.literal('easy'),
  v.literal('medium'),
  v.literal('hard'),
  v.null()
)
export const status = v.union(
  v.literal('waiting'),
  v.literal('playing'),
  v.literal('finished')
)

// all documents have a _id and _creationTime fields by default
export default defineSchema({
  kb_games: defineTable({
    boType,
    // default value 'waiting'
    status,
    // default value null
    difficulty,
    // same type and naming conventation as _creationTime
    // but not keeping the underscore to differentiate with system fields
    modificationTime: v.number()
    // re-visit this later
    // when should it be used? only for BOs or also on free play?
    // how would it work with convex? cannot write the SQL for a recursive query, thus multiple serial queries
    // or change it to `initialGameId`, so that I can get all the games with 1 query?
    // previousGameId: v.union(v.id('kb_games'), v.null())
  }),
  kb_game_players: defineTable({
    // userId is comming from better-auth (external db), and it's a string
    userId: v.string(),
    gameId: v.id('kb_games'),
    // default value '[[],[],[]]'
    board: v.string(),
    // default value 0
    score: v.number(),
    // default value false
    rematch: v.boolean(),
    // default value null
    dieToPlay: v.union(v.number(), v.null()),
    // same type and naming conventation as _creationTime
    // but not keeping the underscore to differentiate with system fields
    modificationTime: v.number()
  })
    // when retrieving players for a game, or games for a player
    // https://docs.convex.dev/understanding/best-practices/#check-for-redundant-indexes
    .index('by_game_and_user', ['gameId', 'userId'])
})
