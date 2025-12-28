import { NextResponse } from 'next/server'
import { customersService, isDbAvailable } from '@/lib/services/dataService'
import { prisma } from '@/lib/prisma'
import { customersAdapter } from '@/lib/services/localStorageAdapter'

// GET all customers
export async function GET() {
    try {
        const dbAvailable = await isDbAvailable()

        if (dbAvailable) {
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
                console.error('Error fetching customers from DB, falling back to localStorage:', error)
            }
        }

        // Fallback to localStorage
        const customers = customersAdapter.getAll()
        const formattedCustomers = customers.map(c => ({
            id: c.id,
            nameAr: c.nameAr,
            phone: c.phone,
            email: c.email,
            idNumber: c.idNumber,
            address: null,
            customerType: c.customerType || 'INDIVIDUAL',
            notes: null,
            bookingsCount: 0,
            invoicesCount: 0,
            totalSpent: 0,
            createdAt: c.createdAt
        }))

        return NextResponse.json(formattedCustomers)
    } catch (error) {
        console.error('Error fetching customers:', error)
        return NextResponse.json([], { status: 500 })
    }
}

// POST - Create new customer
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const dbAvailable = await isDbAvailable()

        if (dbAvailable) {
            try {
                // Get a valid user ID (first admin user) for createdById
                let createdById = body.createdById

                if (!createdById || createdById === 'system') {
                    const adminUser = await prisma.user.findFirst({
                        where: { role: 'ADMIN', status: 'ACTIVE' },
                        select: { id: true }
                    })
                    createdById = adminUser?.id
                }

                if (!createdById) {
                    // Try to create system user
                    const newUser = await prisma.user.create({
                        data: {
                            username: 'system',
                            password: 'hashedpassword',
                            nameAr: 'النظام',
                            role: 'ADMIN'
                        }
                    })
                    createdById = newUser.id
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
                console.error('Error creating customer in DB, falling back to localStorage:', error)
            }
        }

        // Fallback to localStorage
        const newCustomer = customersAdapter.create({
            nameAr: body.nameAr,
            phone: body.phone,
            email: body.email,
            idNumber: body.idNumber,
            customerType: body.customerType || 'INDIVIDUAL'
        })

        return NextResponse.json(newCustomer, { status: 201 })
    } catch (error) {
        console.error('Error creating customer:', error)
        return NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
        )
    }
}
