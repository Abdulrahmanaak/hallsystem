import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
    schema: path.join('prisma', 'schema.prisma'),

    // Connection URL for Prisma Migrate
    // @ts-expect-error - Prisma 7 type definition update pending
    migrate: {
        url: process.env.DATABASE_URL!,
    },
})
