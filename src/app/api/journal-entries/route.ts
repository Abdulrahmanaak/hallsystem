import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { enforceSubscription } from '@/lib/subscription'

const ALLOWED_ROLES = ['SUPER_ADMIN', 'HALL_OWNER', 'ACCOUNTANT', 'ROOM_SUPERVISOR']

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId

        if (!ownerId) {
            return NextResponse.json({ error: 'Configuration Error: No Owner ID found' }, { status: 500 })
        }

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '100')
        const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
        const month = searchParams.get('month') ? parseInt(searchParams.get('month')!) : undefined

        const where: Record<string, unknown> = { ownerId, isDeleted: false }
        if (year) where.year = year
        if (month) where.month = month

        const entries = await prisma.journalEntry.findMany({
            where,
            orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
            take: limit,
            include: {
                createdBy: {
                    select: {
                        nameAr: true,
                        username: true
                    }
                }
            }
        })

        return NextResponse.json(entries)

    } catch (error) {
        console.error('Error fetching journal entries:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        if (!ALLOWED_ROLES.includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await req.json()
        const { amount, month, year, categoryId, categoryName, description } = body

        if (amount == null || amount === '' || !month || !year || !categoryId || !categoryName) {
            return NextResponse.json({ error: 'المبلغ والشهر والسنة والصنف مطلوبة' }, { status: 400 })
        }

        if (month < 1 || month > 12) {
            return NextResponse.json({ error: 'الشهر يجب أن يكون بين 1 و 12' }, { status: 400 })
        }

        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId

        if (!ownerId) {
            return NextResponse.json({ error: 'Configuration Error: No Owner ID found' }, { status: 500 })
        }

        // Auto-generate entry number and create in a single transaction to prevent race conditions
        const entry = await prisma.$transaction(async (tx) => {
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
            const entryNumber = `JE-${year}-${nextSeq.toString().padStart(4, '0')}`

            return tx.journalEntry.create({
                data: {
                    entryNumber,
                    month,
                    year,
                    amount,
                    categoryId,
                    categoryName,
                    description: description || null,
                    ownerId,
                    createdById: session.user.id
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
        })

        return NextResponse.json(entry)

    } catch (error) {
        console.error('Error creating journal entry:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
