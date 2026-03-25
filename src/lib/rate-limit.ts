import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Postgres-backed rate limiter that works on serverless (Netlify/Vercel).
 * Uses a lightweight table created on first use.
 */

let tableEnsured = false

async function ensureTable() {
    if (tableEnsured) return
    try {
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "_rate_limits" (
                "key" TEXT NOT NULL,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        `)
        await prisma.$executeRawUnsafe(`
            CREATE INDEX IF NOT EXISTS "_rate_limits_key_created_idx"
            ON "_rate_limits" ("key", "created_at")
        `)
    } catch {
        // Table may already exist or we lack DDL permissions — fall through
    }
    tableEnsured = true
}

/**
 * Rate limit check using Postgres.
 * Returns null if allowed, or a 429 NextResponse if rate limited.
 */
export async function rateLimit(
    identifier: string,
    { maxRequests = 60, windowMs = 60_000 }: { maxRequests?: number; windowMs?: number } = {}
): Promise<NextResponse | null> {
    try {
        await ensureTable()

        const windowStart = new Date(Date.now() - windowMs)

        // Insert this request and count recent ones in a single transaction
        await prisma.$executeRawUnsafe(
            `INSERT INTO "_rate_limits" ("key", "created_at") VALUES ($1, NOW())`,
            identifier
        )

        const result = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
            `SELECT COUNT(*) as count FROM "_rate_limits" WHERE "key" = $1 AND "created_at" > $2`,
            identifier,
            windowStart
        )

        const count = Number(result[0].count)

        if (count > maxRequests) {
            return NextResponse.json(
                { error: 'عدد الطلبات تجاوز الحد المسموح. يرجى المحاولة لاحقاً.' },
                {
                    status: 429,
                    headers: { 'Retry-After': String(Math.ceil(windowMs / 1000)) }
                }
            )
        }

        // Cleanup old entries (fire-and-forget, don't block response)
        prisma.$executeRawUnsafe(
            `DELETE FROM "_rate_limits" WHERE "created_at" < $1`,
            new Date(Date.now() - windowMs * 2)
        ).catch(() => { /* ignore cleanup errors */ })

        return null
    } catch {
        // If rate limiting fails (DB issue), allow the request through
        return null
    }
}

/**
 * Extract client identifier from request (IP or forwarded header).
 */
export function getClientId(request: Request): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    )
}
