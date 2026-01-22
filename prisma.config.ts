import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    earlyAccess: true,
    schema: path.join('prisma', 'schema.prisma'),

    // Connection URL for Prisma Migrate
    migrate: {
        url: process.env.DATABASE_URL!,
    },
})
