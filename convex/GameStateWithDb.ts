/* eslint-disable @typescript-eslint/consistent-type-definitions */

import {
  AbstractGameState,
  type CreateGameStateOptions,
  type VoteType
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
  history?: GameStateWithDb[]
}

type CreateGameStateWithDbOptions = CreateGameStateOptions & {
  baseGameId: Id<'kb_games'> | null
  ctx: GenericCtx
}

function checkCanMutate(ctx: GenericCtx): asserts ctx is MutationCtx {
  if (!('runMutation' in ctx)) {
    throw new Error('Cannot mutate without a mutation context')
  }
}

// TODO: use neverthrow
// what about ServerGameState?
export class GameStateWithDb extends AbstractGameState<
  ConvexGame,
  UpdatedConvexPlayer
> {
  private readonly ctx: GenericCtx

  // instantiators

  constructor({ ctx, game, players, userId, history }: GameStateWithDbOptions) {
    super({
      game,
      players: players.map((player) => ({
        ...player,
        board: JSON.parse(player.board)
      })),
      userId,
      history
    })
    this.ctx = ctx
  }

  public static async get(
    ctx: GenericCtx,
    userId: string,
    gameId: Id<'kb_games'>
  ) {
    const [game, players] = await Promise.allSettled([
      ctx.db.get(gameId),
      ctx.db
        .query('kb_game_players')
        .withIndex('by_game_and_user', (q) => q.eq('gameId', gameId))
        .take(2)
    ])
    if (game.status === 'rejected' || game.value === null) {
      throw new Error('Game not found')
    }
    if (players.status === 'rejected' || players.value.length === 0) {
      throw new Error('Players not found')
    }
    const baseGameId = game.value.baseGameId
    const history =
      baseGameId !== null
        ? await GameStateWithDb.getHistory(ctx, baseGameId, userId)
        : []

    return new GameStateWithDb({
      ctx,
      userId,
      game: game.value,
      players: players.value,
      history
    })
  }

  static async create({
    ctx,
    boType,
    difficulty,
    userId,
    baseGameId
  }: CreateGameStateWithDbOptions) {
    checkCanMutate(ctx)

    const game = GameStateWithDb.createGame({ boType, difficulty })
    const { _id, _creationTime, ...gameProps } = game

    // fetch history before creating the game, otherwise, it'll be in the history
    const history: GameStateWithDb[] =
      baseGameId !== null
        ? await GameStateWithDb.getHistory(ctx, baseGameId, userId)
        : []

    const gameId = await ctx.db.insert('kb_games', { ...gameProps, baseGameId })

    return new GameStateWithDb({
      ctx,
      userId,
      game: {
        ...game,
        baseGameId,
        _id: gameId,
        _creationTime: game.modificationTime
      },
      players: [],
      history
    })
  }

  // accessors and state describers

  public override get gameId() {
    return this.game._id
  }

  // overriden methods to persist data

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
      this.hasRoundEnded &&
        this.ctx.db.patch(this.game._id, {
          status: 'finished',
          modificationTime: this.currentPlayer.modificationTime
        })
    ])
  }

  public override async voteFor(voteType: VoteType) {
    checkCanMutate(this.ctx)
    super.voteFor(voteType)

    const nextGame =
      this.shouldProceedWithVote && this.nextGameState !== undefined
        ? this.nextGameState.toJson.game
        : undefined

    await Promise.allSettled([
      this.ctx.db.patch(this.currentPlayer!._id, {
        voteFor: voteType,
        modificationTime: this.currentPlayer!.modificationTime
      }),
      this.isAgainstAi &&
        this.ctx.db.patch(this.opponent!._id, {
          voteFor: voteType,
          modificationTime: this.opponent!.modificationTime
        }),
      nextGame !== undefined && this.ctx.db.insert('kb_games', nextGame)
    ])
  }

  // technically is slightly sub-optimal because we don't add both players in
  // parallel for AI games, but it's not a big deal.
  protected override async addPlayer(userId: string) {
    checkCanMutate(this.ctx)
    if (!this.canUserJoin(userId)) return
    // ideally, addPlayer returns the added player, but for some reason, I cannot
    // make it work with the overridden signature that returns it in a promise.
    super.addPlayer(userId)

    // should always be present if it passed `canUserJoin` before `addPlayer`
    const addedPlayer = this.players.find((p) => p.userId === userId)!

    // should have handlers to be using allSettled
    await Promise.all([
      this.ctx.db.insert('kb_game_players', {
        userId,
        gameId: this.gameId,
        dieToPlay: addedPlayer.dieToPlay,
        board: JSON.stringify(addedPlayer.board),
        modificationTime: addedPlayer.modificationTime,
        voteFor: addedPlayer.voteFor,
        score: addedPlayer.score
      }),
      this.shouldStartGame &&
        this.ctx.db.patch(this.gameId, {
          status: 'playing',
          modificationTime: addedPlayer.modificationTime
        })
    ])
  }

  // overridden methods for db specific types

  public async join() {
    await this.addPlayer(this.currentUserId)
  }

  public async addOpponent(userId: string) {
    await this.addPlayer(userId)
  }

  protected override generatePlayer(): UpdatedConvexPlayer {
    return {
      _id: 'TO BE SET' as Id<'kb_game_players'>,
      _creationTime: Date.now(),
      gameId: 'TO BE SET' as Id<'kb_games'>,
      userId: 'TO BE SET',
      board: [[], [], []],
      score: 0,
      voteFor: null,
      dieToPlay: null,
      modificationTime: Date.now()
    }
  }

  private static createGame(overrides?: Partial<ConvexGame>): ConvexGame {
    return {
      _id: 'TO BE SET' as Id<'kb_games'>,
      _creationTime: Date.now(),
      boType: 'free_play',
      difficulty: null,
      status: 'waiting',
      baseGameId: null,
      modificationTime: Date.now(),
      ...overrides
    }
  }

  protected override generateGame(): ConvexGame {
    return GameStateWithDb.createGame()
  }

  protected override generateNextGameState(userId: string): GameStateWithDb {
    return new GameStateWithDb({
      userId,
      ctx: this.ctx,
      game: this.generateGame(),
      players: [],
      history: []
    })
  }

  // internal utils

  private static async getHistory(
    ctx: GenericCtx,
    baseGameId: Id<'kb_games'>,
    userId: string
  ) {
    const history: GameStateWithDb[] = []
    const previousGames = await ctx.db
      .query('kb_games')
      .withIndex('by_base_game_id', (q) => q.eq('baseGameId', baseGameId))
      .collect()
    // might add a baseGameId to players as well so that it's more efficient to retrieve
    const previousGamePlayers = await Promise.allSettled(
      previousGames.map(async (game) => {
        return {
          game,
          players: await ctx.db
            .query('kb_game_players')
            .withIndex('by_game_and_user', (q) => q.eq('gameId', game._id))
            .take(2)
        }
      })
    )
    for (const prev of previousGamePlayers) {
      if (prev.status === 'fulfilled') {
        const { game, players } = prev.value
        const gameState = new GameStateWithDb({
          game,
          players,
          ctx,
          userId
        })
        history.push(gameState)
      }
    }
    return history
  }
}
