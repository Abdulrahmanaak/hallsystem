import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all customers
export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            where: {
                isDeleted: false
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
            orderBy: {
                createdAt: 'desc'
            }
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

        return NextResponse.json(formattedCustomers)
    } catch (error) {
        console.error('Error fetching customers:', error)
        console.log('⚠️ Database unavailable, falling back to MOCK_CUSTOMERS');
        const { MOCK_CUSTOMERS } = await import('@/lib/mock-data');
        return NextResponse.json(MOCK_CUSTOMERS);
    }
}

// POST - Create new customer
export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Get a valid user ID (first admin user) for createdById
        // In production, this should come from the authenticated session
        let createdById = body.createdById

        if (!createdById || createdById === 'system') {
            const adminUser = await prisma.user.findFirst({
                where: { role: 'ADMIN', status: 'ACTIVE' },
                select: { id: true }
            })
            createdById = adminUser?.id
        }

        if (!createdById) {
            return NextResponse.json(
                { error: 'No valid user found to create customer' },
                { status: 400 }
            )
        }

        const customer = await prisma.customer.create({
            data: {
                nameAr: body.nameAr,
                phone: body.phone,
                email: body.email || null,
                idNumber: body.idNumber || null,
                address: body.address || null,
                customerType: body.customerType || 'INDIVIDUAL',
                notes: body.notes || null,
                createdById: createdById
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

