import { createAPIFileRoute } from '@tanstack/react-start/api'
import { type } from 'arktype'
import { eq } from 'drizzle-orm'
import { json } from '@tanstack/react-start'
import { getRandomDice, getTotalScore } from '~/common'
import { db, operations } from '~/lib/server/db'
import { kbGame, kbGamePlayer } from '~/lib/server/schemas'

const playSchema = type({
  column: '1 <= number.integer <= 3'
})

const boardSchema = type('string.json.parse').to('number[][]')

function checkIsBoardFull(board: number[][]) {
  // 3 columns x 3 rows = 9 dice
  return board.flat().length === 9
}

// TODO: AI play
export const APIRoute = createAPIFileRoute('/api/game/$id/play')({
  POST: async ({ request, params }) => {
    const body = playSchema(request.body)
    if (body instanceof type.errors) {
      return json(
        { error: body.summary },
        {
          status: 400
        }
      )
    }
    const { column } = body

    const gameState = await db.query.kbGame.findFirst({
      where: (kbGame, { eq }) => eq(kbGame.id, params.id),
      with: {
        players: true
      }
    })

    if (gameState === undefined) {
      return json({ error: 'Game not found' }, { status: 404 })
    }

    if (gameState.status !== 'playing') {
      return json({ error: 'Game is not active' }, { status: 400 })
    }

    const player = gameState.players.find(
      (player) => player.userId === 'user-1'
    )
    // impossible to have a playing game without an opponent
    const opponent = gameState.players.find(
      (player) => player.userId !== 'user-1'
    )!

    if (player === undefined) {
      return json({ error: 'Player not found in game' }, { status: 404 })
    }

    const dieToPlay = player.dieToPlay
    if (dieToPlay === null) {
      return json({ error: "It is not player's turn" }, { status: 400 })
    }

    // perhaps add a class for entities to have some reusable business logic?
    // though it won't be used outside of here (except when doing optimistic
    // updates)
    // use arktype
    const playerBoard = boardSchema(player.board)
    // though that would be purely a server side issue, perhaps that should not
    // be returned?
    if (playerBoard instanceof type.errors) {
      return json(
        { error: playerBoard.summary },
        {
          status: 400
        }
      )
    }
    const opponentBoard = boardSchema(opponent.board)
    if (opponentBoard instanceof type.errors) {
      return json(
        { error: opponentBoard.summary },
        {
          status: 400
        }
      )
    }

    if (playerBoard[column].length === 3) {
      return json(
        { error: 'Cannot place a die in a full column' },
        { status: 400 }
      )
    }

    playerBoard[column].push(dieToPlay)
    opponentBoard[column] = opponentBoard[column].filter(
      (die) => die !== dieToPlay
    )

    // TODO: AI play

    const isPlayerBoardFull = checkIsBoardFull(playerBoard)
    const nextDie = getRandomDice()
    const updatedAt = new Date()

    // not properly typed :(, but don't need it to now
    await db.batch(
      operations([
        db
          .update(kbGamePlayer)
          .set({
            board: JSON.stringify(playerBoard),
            score: getTotalScore(playerBoard),
            updatedAt,
            dieToPlay: null
          })
          // wtf why does ts complain here
          .where(eq(kbGamePlayer.userId, player.userId)),
        db
          .update(kbGamePlayer)
          .set({
            board: JSON.stringify(opponentBoard),
            score: getTotalScore(opponentBoard),
            updatedAt,
            dieToPlay: nextDie
          })
          .where(eq(kbGamePlayer.userId, opponent.userId)),
        isPlayerBoardFull &&
          db.update(kbGame).set({ status: 'finished', updatedAt })
      ])
    )

    return new Response(null, { status: 201 })
  }
})
