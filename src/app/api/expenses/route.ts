import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

import { enforceSubscription } from '@/lib/subscription'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await req.json()
        const { amount, description, expenseDate, category, imageUrl, vendorId } = body

        if (!amount || !description) {
            return NextResponse.json({ error: 'المبلغ والوصف مطلوبان' }, { status: 400 })
        }

        // Determine ownerId
        // If user is HALL_OWNER, they are the owner
        // If user is employee/supervisor, they belong to an owner
        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId

        if (!ownerId) {
            return NextResponse.json({ error: 'Configuration Error: No Owner ID found' }, { status: 500 })
        }

        const expense = await prisma.expense.create({
            data: {
                amount,
                description,
                expenseDate: new Date(expenseDate),
                category,
                imageUrl,
                vendorId: vendorId || null,
                ownerId,
                createdById: session.user.id
            }
        })


        return NextResponse.json(expense)

    } catch (error) {
        console.error('Error creating expense:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function GET(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId

        if (!ownerId) {
            return NextResponse.json({ error: 'Configuration Error: No Owner ID found' }, { status: 500 })
        }

        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const expenses = await prisma.expense.findMany({
            where: {
                ownerId: ownerId
            },
            orderBy: {
                expenseDate: 'desc'
            },
            take: limit,
            include: {
                createdBy: {
                    select: {
                        nameAr: true,
                        username: true
                    }
                },
                vendor: {
                    select: {
                        id: true,
                        nameAr: true
                    }
                }
            }
        })

        return NextResponse.json(expenses)

    } catch (error) {
        console.error('Error fetching expenses:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
