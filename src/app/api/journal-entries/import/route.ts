import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { enforceSubscription } from '@/lib/subscription'

// POST - Import a journal entry from Qoyod
export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await req.json()
        const { qoyodId, month, year, amount, categoryName, description } = body

        if (!qoyodId || !month || !year) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId
        if (!ownerId) {
            return NextResponse.json({ error: 'Configuration Error: No Owner ID found' }, { status: 500 })
        }

        // Check if already imported
        const existing = await prisma.journalEntry.findFirst({
            where: { ownerId, qoyodJournalEntryId: qoyodId.toString() }
        })

        if (existing) {
            return NextResponse.json({ success: true, skipped: true, id: existing.id })
        }

        // Generate entry number
        const entryNumber = await prisma.$transaction(async (tx) => {
            const lastEntry = await tx.journalEntry.findFirst({
                where: {
                    ownerId,
                    entryNumber: { startsWith: `JE-${year}-` }
                },
                orderBy: { entryNumber: 'desc' }
            })

            let nextSeq = 1
            if (lastEntry) {
                const parts = lastEntry.entryNumber.split('-')
                nextSeq = parseInt(parts[2]) + 1
            }
            return `JE-${year}-${nextSeq.toString().padStart(4, '0')}`
        })

        const entry = await prisma.journalEntry.create({
            data: {
                entryNumber,
                month,
                year,
                amount: amount || 0,
                categoryId: 0, // Imported from Qoyod, no local category ID
                categoryName: categoryName || 'قيد مستورد',
                description: description || null,
                ownerId,
                createdById: session.user.id,
                syncedToQoyod: true,
                qoyodJournalEntryId: qoyodId.toString(),
                lastSyncAt: new Date()
            }
        })

        return NextResponse.json({ success: true, id: entry.id })

    } catch (error) {
        console.error('Error importing journal entry:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
