import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET single customer
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const customer = await prisma.customer.findUnique({
            where: { id },
            include: {
                bookings: {
                    where: { isDeleted: false },
                    include: {
                        hall: {
                            select: { nameAr: true }
                        }
                    },
                    orderBy: { eventDate: 'desc' }
                }
            }
        })

        if (!customer || customer.isDeleted) {
            return NextResponse.json(
                { error: 'Customer not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(customer)
    } catch (error) {
        console.error('Error fetching customer:', error)
        return NextResponse.json(
            { error: 'Failed to fetch customer' },
            { status: 500 }
        )
    }
}

// PUT - Update customer
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                nameAr: body.nameAr,
                phone: body.phone,
                email: body.email || null,
                idNumber: body.idNumber || null,
                address: body.address || null,
                customerType: body.customerType,
                notes: body.notes || null
            }
        })

        return NextResponse.json(customer)
    } catch (error) {
        console.error('Error updating customer:', error)
        return NextResponse.json(
            { error: 'Failed to update customer' },
            { status: 500 }
        )
    }
}

// DELETE - Soft delete customer
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.customer.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting customer:', error)
        return NextResponse.json(
            { error: 'Failed to delete customer' },
            { status: 500 }
        )
    }
}
