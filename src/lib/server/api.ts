import { ofetch } from 'ofetch'

export const api = ofetch.create({
  baseURL: `${process.env.BASE_URL}/api`
})
