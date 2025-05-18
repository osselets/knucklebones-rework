/* eslint-disable @typescript-eslint/consistent-type-definitions */

import { Player, type PlayerOptions } from '~/common'
import { type Id, type Doc } from './_generated/dataModel'

export type ConvexPlayer = Doc<'kb_game_players'>

type PlayerWithDbOptions = PlayerOptions & {
  _id: Id<'kb_game_players'>
  _creationTime: number
  gameId: Id<'kb_games'>
}

// not doing server calls actually, that should be the responsibility of
// GameStateWithDb.
// otherwise, it would end up with weird things, like GameStateWithDb managing
// PlayerWithDb, but calling AbstractGameState logic, which would call PlayerWithDb
// methods, being async.
export class PlayerWithDb extends Player {
  protected readonly _id: Id<'kb_game_players'>
  protected readonly _creationTime: number
  protected readonly gameId: Id<'kb_games'>

  constructor({ _id, _creationTime, ...rest }: PlayerWithDbOptions) {
    super(rest)
    this.gameId = rest.gameId
    this._id = _id
    this._creationTime = _creationTime
  }

  public override get toJson() {
    return {
      ...super.toJson,
      gameId: this.gameId,
      _id: this._id,
      _creationTime: this._creationTime
    }
  }
}
