import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/server/schemas',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
})
