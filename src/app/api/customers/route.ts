import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { enforceSubscription } from '@/lib/subscription'

// Helper to get owner filter based on user role
async function getOwnerFilter() {
    const session = await auth()
    if (!session?.user) {
        return { error: 'غير مصرح', status: 401 }
    }

    if (session.user.role === 'SUPER_ADMIN') {
        return { filter: {}, session }
    }

    return { filter: { ownerId: session.user.ownerId }, session }
}

// GET all customers
export async function GET() {
    try {
        const ownerResult = await getOwnerFilter()
        if ('error' in ownerResult) {
            return NextResponse.json({ error: ownerResult.error }, { status: ownerResult.status })
        }

        const customers = await prisma.customer.findMany({
            where: {
                isDeleted: false,
                ...ownerResult.filter
            },
            include: {
                _count: {
                    select: {
                        bookings: true,
                        invoices: true
                    }
                },
                bookings: {
                    where: { isDeleted: false },
                    select: {
                        finalAmount: true,
                        status: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const formattedCustomers = customers.map(customer => ({
            id: customer.id,
            nameAr: customer.nameAr,
            phone: customer.phone,
            email: customer.email,
            idNumber: customer.idNumber,
            address: customer.address,
            customerType: customer.customerType,
            notes: customer.notes,
            bookingsCount: customer._count.bookings,
            invoicesCount: customer._count.invoices,
            totalSpent: customer.bookings.reduce((sum, b) => sum + Number(b.finalAmount), 0),
            createdAt: customer.createdAt.toISOString()
        }))

        console.log(`👥 [API/customers] GET: Returning ${formattedCustomers.length} customers`)
        return NextResponse.json(formattedCustomers)
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json([], { status: 500 })
    }
}

// POST - Create new customer
export async function POST(request: Request) {
    try {
        const session = await auth()
        if (!session?.user) {
            return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const body = await request.json()

        const customer = await prisma.customer.create({
            data: {
                nameAr: body.nameAr,
                phone: body.phone,
                email: body.email || null,
                idNumber: body.idNumber || null,
                address: body.address || null,
                customerType: body.customerType || 'INDIVIDUAL',
                notes: body.notes || null,
                ownerId: session.user.ownerId, // Tenant isolation
                createdById: session.user.id
            }
        })

        return NextResponse.json(customer, { status: 201 })
    } catch (error) {
        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        )
    }
}
