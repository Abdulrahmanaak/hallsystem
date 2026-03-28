import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { enforceSubscription } from '@/lib/subscription'
import { getQoyodConfig, qoyodRequest } from '@/lib/services/qoyod'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HALL_OWNER', 'ACCOUNTANT', 'ROOM_SUPERVISOR']

// PUT - Update Journal Entry
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await req.json()
        const { amount, month, year, categoryId, categoryName, description } = body

        if (amount == null || amount === '' || !month || !year || !categoryId || !categoryName) {
            return NextResponse.json({ error: 'المبلغ والشهر والسنة والصنف مطلوبة' }, { status: 400 })
        }

        const existing = await prisma.journalEntry.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
        }

        // Verify ownership
        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId
        if (existing.ownerId !== ownerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const updated = await prisma.journalEntry.update({
            where: { id },
            data: {
                amount,
                month,
                year,
                categoryId,
                categoryName,
                description: description || null
            },
            include: {
                createdBy: {
                    select: {
                        nameAr: true,
                        username: true
                    }
                }
            }
        })

        return NextResponse.json(updated)

    } catch (error) {
        console.error('Error updating journal entry:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE - Soft Delete Journal Entry
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const { id } = await params

        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const entry = await prisma.journalEntry.findUnique({ where: { id } })
        if (!entry) {
            return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 })
        }

        // Verify ownership
        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId
        if (entry.ownerId !== ownerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Delete from Qoyod if synced
        let qoyodDeleted = false
        if (entry.syncedToQoyod && entry.qoyodJournalEntryId) {
            try {
                const config = await getQoyodConfig(ownerId)
                if (config) {
                    await qoyodRequest(`/journal_entries/${entry.qoyodJournalEntryId}`, 'DELETE', null, config)
                    qoyodDeleted = true
                }
            } catch (error) {
                console.error('Error deleting journal entry from Qoyod:', error)
                // Continue with local delete
            }
        }

        // Soft delete locally
        await prisma.journalEntry.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                syncedToQoyod: false,
                qoyodJournalEntryId: null
            }
        })

        return NextResponse.json({ success: true, qoyodDeleted })

    } catch (error) {
        console.error('Error deleting journal entry:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
