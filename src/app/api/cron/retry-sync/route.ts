import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createTenantLogger } from '@/lib/logger'

const log = createTenantLogger({ module: 'retry-sync' })
const MAX_RETRIES = 3

export async function GET(request: Request) {
    try {
        // Validate CRON secret
        const cronSecret = request.headers.get('x-cron-secret')
        if (cronSecret !== process.env.CRON_SECRET) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Find FAILED syncs from last 24h that haven't exceeded retry limit
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000)

        const failedSyncs = await prisma.accountingSync.findMany({
            where: {
                status: 'FAILED',
                completedAt: { gte: since },
            },
            orderBy: { completedAt: 'asc' },
            take: 20 // Process in batches
        })

        let retried = 0
        let skipped = 0

        for (const sync of failedSyncs) {
            // Parse retry count from requestData
            let requestData: Record<string, unknown> = {}
            try {
                requestData = JSON.parse(sync.requestData || '{}')
            } catch { /* ignore */ }

            const retryCount = Number(requestData.retryCount) || 0
            if (retryCount >= MAX_RETRIES) {
                skipped++
                continue
            }

            // Attempt retry by calling the qoyod sync endpoint internally
            try {
                const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                const type = requestData.type as string
                const id = sync.recordId

                if (!type || !id) {
                    skipped++
                    continue
                }

                const res = await fetch(`${baseUrl}/api/qoyod`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-cron-secret': process.env.CRON_SECRET || ''
                    },
                    body: JSON.stringify({ type, id })
                })

                if (res.ok) {
                    // Mark the old failed record as superseded
                    await prisma.accountingSync.update({
                        where: { id: sync.id },
                        data: {
                            status: 'RETRIED',
                            requestData: JSON.stringify({ ...requestData, retryCount: retryCount + 1, retriedAt: new Date().toISOString() })
                        }
                    })
                    retried++
                    log.info({ recordId: id, type, retryCount: retryCount + 1 }, 'Sync retry succeeded')
                } else {
                    // Update retry count
                    await prisma.accountingSync.update({
                        where: { id: sync.id },
                        data: {
                            requestData: JSON.stringify({ ...requestData, retryCount: retryCount + 1, lastRetryAt: new Date().toISOString() })
                        }
                    })
                    log.warn({ recordId: id, type, status: res.status }, 'Sync retry failed')
                }
            } catch (err) {
                log.error({ err, recordId: sync.recordId }, 'Sync retry error')
            }
        }

        return NextResponse.json({
            processed: failedSyncs.length,
            retried,
            skipped,
            timestamp: new Date().toISOString()
        })

    } catch (error) {
        log.error({ err: error }, 'Retry sync cron error')
        return NextResponse.json({ error: 'Retry sync failed' }, { status: 500 })
    }
}
