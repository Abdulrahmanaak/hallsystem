import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const health: {
        status: string
        timestamp: string
        database?: string
    } = {
        status: 'ok',
        timestamp: new Date().toISOString(),
    }

    // Optional DB connectivity check
    try {
        await prisma.$queryRaw`SELECT 1`
        health.database = 'connected'
    } catch {
        health.status = 'degraded'
        health.database = 'disconnected'
    }

    const status = health.status === 'ok' ? 200 : 503
    return NextResponse.json(health, { status })
}
