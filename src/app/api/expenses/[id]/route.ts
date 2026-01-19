import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Verify ownership
        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId

        const expense = await prisma.expense.findFirst({
            where: {
                id,
                ownerId: ownerId || undefined
            }
        })

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        await prisma.expense.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting expense:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
