import { type } from 'arktype'

// have to define these types manually so that client code can use it without issues
// related to: https://github.com/drizzle-team/drizzle-orm/issues/4383
// if drizzle-arktype can be used client side without weird workaround
// (vite-plugin-node-polyfills), then it can be defined simply like this:
// export const kbGameStateType = kbGameSelectSchema.and({
//   players: kbGamePlayerSelectSchema
//     .and({
//       user: userSelectSchema.pick('name')
//     })
//     .array()
// })
// export type KbGameState = typeof kbGameStateType.infer

export const kbGame = type({
  id: 'string',
  boType: '"free_play" | "1" | "3" | "5"',
  status: '"waiting" | "playing" | "finished"',
  difficulty: '"easy" | "medium" | "hard" | null',
  previousGameId: 'string.uuid | null',
  createdAt: 'string.date.iso.parse | Date |> Date',
  updatedAt: 'string.date.iso.parse | Date |> Date'
})
export type KbGame = typeof kbGame.infer

export const kbGamePlayer = type({
  userId: 'string',
  gameId: 'string.uuid',
  board: 'string.json.parse | number[][] |> number[][]',
  score: 'number',
  rematch: 'boolean',
  dieToPlay: 'number | null',
  createdAt: 'string.date.iso.parse | Date |> Date',
  updatedAt: 'string.date.iso.parse | Date |> Date',
  user: { name: 'string' }
})
export type KbGamePlayer = typeof kbGamePlayer.infer

export const kbGameStateType = kbGame.and({
  players: kbGamePlayer.array()
})
export type KbGameState = typeof kbGameStateType.infer
