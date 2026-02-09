
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { enforceSubscription } from '@/lib/subscription'
import { getQoyodConfig, qoyodRequest } from '@/lib/services/qoyod'

// PUT - Update Expense
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id } = await params

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await req.json()
        const { amount, description, expenseDate, category, imageUrl, vendorId } = body

        if (!amount || !description) {
            return NextResponse.json({ error: 'المبلغ والوصف مطلوبان' }, { status: 400 })
        }

        // Get existing expense to check ownership and sync status
        const existingExpense = await prisma.expense.findUnique({
            where: { id },
            include: { vendor: true }
        })

        if (!existingExpense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        // Verify ownership
        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId
        if (existingExpense.ownerId !== ownerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Update local expense
        const updatedExpense = await prisma.expense.update({
            where: { id },
            data: {
                amount,
                description,
                expenseDate: new Date(expenseDate),
                category,
                imageUrl,
                vendorId: vendorId || null,
            },
            include: { vendor: true }
        })

        // Sync to Qoyod if enabled and linked
        if (updatedExpense.syncedToQoyod && updatedExpense.qoyodExpenseId) {
            try {
                const config = await getQoyodConfig(ownerId)
                if (config) {
                    const payload: any = {
                        expense: {
                            reference: updatedExpense.description.substring(0, 50),
                            issue_date: updatedExpense.expenseDate.toISOString().split('T')[0],
                            amount: Number(updatedExpense.amount),
                            description: updatedExpense.description,
                            tax_inclusive: true,
                        }
                    }

                    // Attempt to use default bank account if available
                    if (config.defaultBankAccountId) {
                        payload.expense.paid_through_account_id = config.defaultBankAccountId
                    }

                    if (updatedExpense.vendor?.qoyodVendorId) {
                        payload.expense.contact_id = updatedExpense.vendor.qoyodVendorId
                    }

                    await qoyodRequest(`/expenses/${updatedExpense.qoyodExpenseId}`, 'PUT', payload, config)

                    // Update last sync time
                    await prisma.expense.update({
                        where: { id },
                        data: { lastSyncAt: new Date() }
                    })
                }
            } catch (error) {
                console.error('Failed to update Qoyod expense:', error)
                // Don't fail the request, just log error. User sees local update.
            }
        }

        return NextResponse.json(updatedExpense)

    } catch (error) {
        console.error('Error updating expense:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE - Delete Expense
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

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const expense = await prisma.expense.findUnique({
            where: { id }
        })

        if (!expense) {
            return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
        }

        // Verify ownership
        const ownerId = session.user.role === 'HALL_OWNER' ? session.user.id : session.user.ownerId
        if (expense.ownerId !== ownerId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Qoyod Delete
        let qoyodDeleted = false
        if (expense.syncedToQoyod && expense.qoyodExpenseId) {
            try {
                const config = await getQoyodConfig(ownerId)

                if (config) {
                    await qoyodRequest(`/expenses/${expense.qoyodExpenseId}`, 'DELETE', null, config)
                    qoyodDeleted = true
                } else {
                    // Qoyod disabled/missing config. Allow local delete but warn.
                    console.warn(`Expense ${id} is synced but Qoyod config is missing. Deleting locally only.`)
                }
            } catch (error: any) {
                console.error('Error deleting from Qoyod:', error)

                if (error.message && error.message.includes('404')) {
                    qoyodDeleted = true
                } else {
                    return NextResponse.json(
                        { error: 'فشل الحذف من قيود. يرجى المحاولة مرة أخرى أو التحقق من الاتصال.' },
                        { status: 500 }
                    )
                }
            }
        }

        // Soft Delete Local
        const deleted = await prisma.expense.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                syncedToQoyod: false,
                qoyodExpenseId: null
            }
        })

        return NextResponse.json({ success: true, qoyodDeleted })

    } catch (error) {
        console.error('Error deleting expense:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
