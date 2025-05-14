import { eq, sql } from 'drizzle-orm'
import { getTotalScore } from '~/common'
import { GameState } from '~/lib/iso/business/GameState'
import { db, operations } from '../db'
import { kbGame, kbGamePlayer } from '../schemas'
import { shouldNeverHappenInServer } from '../utils/shouldNeverHappen'

// TODO: use neverthrow
export class GameStateWithDb extends GameState {
  // constructor()

  public async play(userId: string, column: number) {
    super.play(userId, column)

    const { player, opponent } = this.getPlayers(userId)
    if (opponent === undefined) {
      shouldNeverHappenInServer(
        'There should always be an opponent while game is ongoing'
      )
    }
    const updatedAt = new Date()

    await db.batch(
      operations([
        db
          .update(kbGamePlayer)
          .set({
            board: JSON.stringify(player.board),
            score: getTotalScore(player.board),
            updatedAt,
            dieToPlay: player.dieToPlay
          })
          .where(
            sql`${kbGamePlayer.userId} = ${player.userId} AND ${kbGamePlayer.gameId} = ${this.gameState.id}`
          ),
        db
          .update(kbGamePlayer)
          .set({
            board: JSON.stringify(opponent.board),
            score: getTotalScore(opponent.board),
            updatedAt,
            dieToPlay: opponent.dieToPlay
          })
          .where(
            sql`${kbGamePlayer.userId} = ${opponent.userId} AND ${kbGamePlayer.gameId} = ${this.gameState.id}`
          ),
        this.hasEnded &&
          db
            .update(kbGame)
            .set({ status: 'finished', updatedAt })
            .where(eq(kbGame.id, this.gameState.id))
      ])
    )
  }

  public async joinIfPossible(userId: string, aiUserId?: string) {
    if (!this.canJoin(userId)) {
      return
    }
    super.joinIfPossible(userId, aiUserId)
    const { player, opponent } = this.getPlayers(userId)

    if (aiUserId === undefined) {
      await db.batch(
        operations([
          db.insert(kbGamePlayer).values({
            gameId: this.gameState.id,
            userId,
            dieToPlay: player.dieToPlay
          }),
          opponent !== undefined &&
            db
              .update(kbGamePlayer)
              .set({ dieToPlay: opponent.dieToPlay })
              .where(sql`${kbGamePlayer.userId} = ${opponent.userId}`),
          this.shouldStartGame &&
            db
              .update(kbGame)
              .set({ status: 'playing', updatedAt: new Date() })
              .where(eq(kbGame.id, this.gameState.id))
        ])
      )
      return
    }

    await db.batch(
      // map isn't accepted for batch...
      // this.gameState.players.map((player) =>
      //   db.insert(kbGamePlayer).values({
      //     userId: player.userId,
      //     gameId: this.gameState.id,
      //     dieToPlay: player.dieToPlay
      //   })
      // )
      operations([
        db.insert(kbGamePlayer).values({
          userId: this.gameState.players[0].userId,
          gameId: this.gameState.id,
          dieToPlay: this.gameState.players[0].dieToPlay
        }),
        db.insert(kbGamePlayer).values({
          userId: this.gameState.players[1].userId,
          gameId: this.gameState.id,
          dieToPlay: this.gameState.players[1].dieToPlay
        }),
        this.shouldStartGame &&
          db
            .update(kbGame)
            .set({ status: 'playing', updatedAt: new Date() })
            .where(eq(kbGame.id, this.gameState.id))
      ])
    )
  }
}
