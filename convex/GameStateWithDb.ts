/* eslint-disable @typescript-eslint/consistent-type-definitions */

import {
  type CreateGameStateOptions,
  GameState,
  generatePlayer
} from '~/common'
import { type Id, type Doc } from './_generated/dataModel'
import { type MutationCtx, type QueryCtx } from './_generated/server'

type ConvexGame = Doc<'kb_games'>
// That's how the players will come from the database, and how they will be persisted
type ConvexPlayer = Doc<'kb_game_players'>
// That's how they will be managed via the GameState class
type UpdatedConvexPlayer = Omit<ConvexPlayer, 'board'> & { board: number[][] }
type GenericCtx = QueryCtx | MutationCtx

type GameStateWithDbOptions = {
  ctx: GenericCtx
  userId: string
  game: ConvexGame
  players: ConvexPlayer[]
}

type CreateGameStateWithDbOptions = CreateGameStateOptions & {
  ctx: GenericCtx
}

function checkCanMutate(ctx: GenericCtx): asserts ctx is MutationCtx {
  if (!('runMutation' in ctx)) {
    throw new Error('Cannot mutate without a mutation context')
  }
}

function generateConvexPlayer(): UpdatedConvexPlayer {
  const player = generatePlayer()
  return {
    ...player,
    _id: 'TO BE SET' as Id<'kb_game_players'>,
    _creationTime: Date.now(),
    gameId: 'TO BE SET' as Id<'kb_games'>
  }
}

// TODO: use neverthrow
export class GameStateWithDb extends GameState<
  ConvexGame,
  UpdatedConvexPlayer
> {
  private readonly ctx: GenericCtx

  constructor({ ctx, game, players, userId }: GameStateWithDbOptions) {
    super({
      game,
      players: players.map((player) => ({
        ...player,
        board: JSON.parse(player.board)
      })),
      userId,
      generatePlayer: generateConvexPlayer
    })
    this.ctx = ctx
  }

  // should use object parameter as well?
  static async createGameInDb({
    ctx,
    boType,
    difficulty,
    userId
  }: CreateGameStateWithDbOptions) {
    checkCanMutate(ctx)

    const gameState = GameState.createGame({ userId, boType, difficulty })
    const { _id, ...game } = gameState.toJson.game
    const gameId = await ctx.db.insert('kb_games', game)

    return new GameStateWithDb({
      ctx,
      userId,
      game: {
        ...game,
        _id: gameId,
        _creationTime: game.modificationTime
      },
      players: []
    })
  }

  public override async play(column: number) {
    checkCanMutate(this.ctx)
    super.play(column)

    if (this.opponent === undefined || this.currentPlayer === undefined) {
      // shouldNeverHappenInServer(
      //   'There should always be an opponent while game is ongoing'
      // )
      throw new Error(
        'There should always be two players while game is ongoing'
      )
    }

    await Promise.allSettled([
      this.ctx.db.patch(this.currentPlayer._id, {
        board: JSON.stringify(this.currentPlayer.board),
        score: this.currentPlayer.score,
        modificationTime: this.currentPlayer.modificationTime,
        dieToPlay: this.currentPlayer.dieToPlay
      }),
      this.ctx.db.patch(this.opponent._id, {
        board: JSON.stringify(this.opponent.board),
        score: this.opponent.score,
        modificationTime: this.opponent.modificationTime,
        dieToPlay: this.opponent.dieToPlay
      }),
      this.hasEnded &&
        this.ctx.db.patch(this.game._id, {
          status: 'finished',
          modificationTime: this.currentPlayer.modificationTime
        })
    ])
  }

  public override async joinIfPossible(aiUserId?: string) {
    checkCanMutate(this.ctx)
    if (!this.canUserJoin) return
    super.joinIfPossible(aiUserId)

    // joinIfPossible doesn't provide a type guard for currentPlayer
    if (this.currentPlayer === undefined) {
      throw new Error('Player not found after joining')
    }

    const shouldUpdateOpponent =
      aiUserId === undefined && this.opponent !== undefined
    const shouldInsertAi = aiUserId !== undefined && this.opponent !== undefined

    await Promise.allSettled([
      this.ctx.db.insert('kb_game_players', {
        userId: this.currentUserId,
        gameId: this.game._id,
        dieToPlay: this.currentPlayer.dieToPlay,
        board: JSON.stringify(this.currentPlayer.board),
        modificationTime: this.currentPlayer.modificationTime,
        rematch: this.currentPlayer.rematch,
        score: this.currentPlayer.score
      }),
      shouldUpdateOpponent &&
        this.ctx.db.patch(this.opponent._id, {
          dieToPlay: this.opponent.dieToPlay,
          modificationTime: this.opponent.modificationTime
        }),
      shouldInsertAi &&
        this.ctx.db.insert('kb_game_players', {
          gameId: this.game._id,
          userId: this.opponent.userId,
          dieToPlay: this.opponent.dieToPlay,
          board: JSON.stringify(this.opponent.board),
          modificationTime: this.opponent.modificationTime,
          rematch: this.opponent.rematch,
          score: this.opponent.score
        }),
      this.shouldStartGame &&
        this.ctx.db.patch(this.game._id, {
          status: 'playing',
          modificationTime: this.currentPlayer.modificationTime
        })
    ])
  }
}
