import * as dotenv from 'dotenv'
import * as path from 'node:path'
import { defineConfig } from 'prisma/config'

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') })

// Use DIRECT_URL for migrations/db push, fallback to DATABASE_URL
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL

if (!databaseUrl) {
    console.error('DATABASE_URL or DIRECT_URL not found in environment')
}

export default defineConfig({
    schema: path.join(__dirname, 'schema.prisma'),
    migrations: {
        path: path.join(__dirname, 'migrations'),
        seed: 'tsx prisma/seed.ts',
    },
    datasource: {
        url: databaseUrl || '',
    },
})
