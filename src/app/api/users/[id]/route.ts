import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// GET single user
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                username: true,
                nameAr: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                lastLogin: true,
                createdAt: true
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: 'Failed to fetch user' },
            { status: 500 }
        )
    }
}

// PUT - Update user
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()

        const updateData: Record<string, unknown> = {
            nameAr: body.nameAr,
            email: body.email || null,
            phone: body.phone || null,
            role: body.role,
            status: body.status
        }

        // Only update password if provided
        if (body.password) {
            updateData.password = await bcrypt.hash(body.password, 10)
        }

        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                username: true,
                nameAr: true,
                role: true,
                status: true
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        )
    }
}

// DELETE - Deactivate user (soft delete)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        await prisma.user.update({
            where: { id },
            data: {
                status: 'INACTIVE'
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deactivating user:', error)
        return NextResponse.json(
            { error: 'Failed to deactivate user' },
            { status: 500 }
        )
    }
}
