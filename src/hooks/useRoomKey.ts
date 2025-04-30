import { Route } from '../routes/game/$id'

export function useRoomKey() {
  const { id } = Route.useParams()
  return id
}
