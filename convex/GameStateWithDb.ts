/* eslint-disable @typescript-eslint/consistent-type-definitions */

import {
  AbstractGameState,
  type PlayerGeneratorOptions,
  type CreateGameStateOptions,
  type VoteType
} from '~/common'
import { type ConvexPlayer, PlayerWithDb } from './PlayerWithDb'
import { type Id, type Doc } from './_generated/dataModel'
import { checkCanMutate } from './utils/ctx'
import { type GenericCtx } from './utils/types'

type ConvexGame = Doc<'kb_games'>

type GameStateWithDbOptions = {
  ctx: GenericCtx
  userId: string
  game: ConvexGame
  players: PlayerWithDb[]
  history?: GameStateWithDb[]
}

type GameStateWithDbJsonOptions = {
  ctx: GenericCtx
  userId: string
  game: ConvexGame
  players: ConvexPlayer[]
  history?: GameStateWithDbJsonOptions[]
}

type PlayerWithDbGeneratorOptions = PlayerGeneratorOptions & {
  gameId: Id<'kb_games'>
  _id: Id<'kb_game_players'>
  _creationTime: number
}

type CreateGameStateWithDbOptions = CreateGameStateOptions & {
  baseGameId: Id<'kb_games'> | null
  ctx: GenericCtx
}

// TODO: use neverthrow
// what about ServerGameState?
export class GameStateWithDb extends AbstractGameState<
  ConvexGame,
  PlayerWithDb
> {
  private readonly ctx: GenericCtx

  // #region instantiators

  constructor({ ctx, game, players, userId, history }: GameStateWithDbOptions) {
    super({
      game,
      players,
      userId,
      history
    })
    this.ctx = ctx
  }

  public static fromJson({
    ctx,
    userId,
    game,
    players,
    history
  }: GameStateWithDbJsonOptions): GameStateWithDb {
    return new GameStateWithDb({
      ctx,
      game,
      players: players.map((p) => new PlayerWithDb(p)),
      userId,
      history: history?.map((g) => GameStateWithDb.fromJson(g))
    })
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

    return GameStateWithDb.fromJson({
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
    const history =
      baseGameId !== null
        ? await GameStateWithDb.getHistory(ctx, baseGameId, userId)
        : []

    const gameId = await ctx.db.insert('kb_games', { ...gameProps, baseGameId })

    return GameStateWithDb.fromJson({
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

  // #endregion instantiators

  // #region accessors and state describers

  public override get gameId() {
    return this.game._id
  }

  // #endregion accessors and state describers

  // #region overriden actions to persist data

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

    const currentPlayer = this.currentPlayer.toJson
    const opponent = this.opponent.toJson

    await Promise.allSettled([
      this.ctx.db.patch(currentPlayer._id, currentPlayer),
      this.ctx.db.patch(opponent._id, opponent),
      this.hasRoundEnded &&
        this.ctx.db.patch(this.game._id, {
          status: 'finished',
          modificationTime: currentPlayer.modificationTime
        })
    ])
  }

  public override async voteFor(voteType: VoteType) {
    checkCanMutate(this.ctx)
    super.voteFor(voteType)

    const currentPlayer = this.currentPlayer!.toJson
    const opponent = this.opponent!.toJson

    const nextGame =
      this.shouldProceedWithVote && this.nextGameState !== undefined
        ? this.nextGameState.toJson.game
        : undefined

    await Promise.allSettled([
      this.ctx.db.patch(currentPlayer._id, {
        votedFor: voteType,
        modificationTime: currentPlayer.modificationTime
      }),
      this.isAgainstAi &&
        this.ctx.db.patch(opponent._id, {
          votedFor: voteType,
          modificationTime: opponent.modificationTime
        }),
      // TODO: to work, this will need to be persisted in the game table
      // so that the query will return it
      // how to make sure we redirect (players and spectators) after players voted,
      // but not if we revisit the game later?
      // TODO: can click on game in BO history to revisit them
      nextGame !== undefined && this.ctx.db.insert('kb_games', nextGame)
    ])
  }

  // overridden methods for db specific types

  public async join() {
    await this.addPlayer(this.currentUserId)
  }

  public async addOpponent(userId: string) {
    await this.addPlayer(userId)
  }

  // TODO: this cannot happen. addPlayer is called within AbstractGameState,
  // so in a not async context (tho that's probably handled because methods from
  // GameStateWithDb are async, anyway), and they may not have all the context.
  // When voting to continue, and creating a new game, we call `addPlayer` to
  // setup the next game state, thus persisting players before the game is created.
  // There are 2 solutions:
  // - either the game is persisted before via another override
  // - or this method shouldn't be implemented, and it'll be the responsibility
  // of other methods to do that (`voteFor` for example).
  // technically is slightly sub-optimal because we don't add both players in
  // parallel for AI games, but it's not a big deal.
  protected override async addPlayer(userId: string) {
    checkCanMutate(this.ctx)
    if (!this.canUserJoin(userId)) return
    // ideally, addPlayer returns the added player, but for some reason, I cannot
    // make it work with the overridden signature that returns it in a promise.
    super.addPlayer(userId)

    // should always be present if it passed `canUserJoin` before `addPlayer`
    const addedPlayer = this.players.find((p) => p.userId === userId)!.toJson

    console.log(this.gameId)

    // should have handlers to be using allSettled
    await Promise.all([
      this.ctx.db.insert('kb_game_players', {
        ...addedPlayer,
        userId,
        gameId: this.gameId
      }),
      this.shouldStartGame &&
        this.ctx.db.patch(this.gameId, {
          status: 'playing',
          modificationTime: addedPlayer.modificationTime
        })
    ])
  }

  // #endregion overriden actions to persist data

  // #region internal generators

  protected override generatePlayer(
    options: PlayerWithDbGeneratorOptions
  ): PlayerWithDb {
    return new PlayerWithDb(options)
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

  // #endregion internal generators

  // #region internal utils

  private static async getHistory(
    ctx: GenericCtx,
    baseGameId: Id<'kb_games'>,
    userId: string
  ): Promise<GameStateWithDbJsonOptions[]> {
    const history: GameStateWithDbJsonOptions[] = []
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
        const gameState = {
          game,
          players,
          ctx,
          userId
        }
        history.push(gameState)
      }
    }
    return history
  }

  // #endregion internal utils
}
