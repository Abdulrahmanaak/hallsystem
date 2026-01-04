/**
 * Seed script to create demo accounts for testing
 * Run with: npx tsx prisma/seed-demo.ts
 */

import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Seeding demo accounts...')

    const hashedPassword = await bcrypt.hash('Demo@123', 12)

    // ============================================
    // 1. Create SUPER_ADMIN (if not exists)
    // ============================================
    let superAdmin = await prisma.user.findUnique({
        where: { username: 'admin' }
    })

    if (!superAdmin) {
        superAdmin = await prisma.user.create({
            data: {
                username: 'admin',
                password: hashedPassword,
                nameAr: 'مدير النظام',
                email: 'admin@system.com',
                phone: '0500000001',
                role: 'SUPER_ADMIN',
                status: 'ACTIVE',
                ownerId: null // Super admin has no owner
            }
        })
        console.log('✅ Created SUPER_ADMIN:', superAdmin.username)
    } else {
        console.log('⚠️ SUPER_ADMIN already exists, skipping...')
    }

    // ============================================
    // 2. Create Demo HALL_OWNER (if not exists)
    // ============================================
    let hallOwner = await prisma.user.findUnique({
        where: { username: 'demo' }
    })

    if (!hallOwner) {
        hallOwner = await prisma.user.create({
            data: {
                username: 'demo',
                password: hashedPassword,
                nameAr: 'قاعة العرض التجريبي',
                email: 'demo@example.com',
                phone: '0500000000',
                role: 'HALL_OWNER',
                status: 'ACTIVE',
                ownerId: null, // Hall owners have null ownerId
                commercialRegNo: '1234567890',
                vatRegNo: '300000000000003'
            }
        })
        console.log('✅ Created HALL_OWNER:', hallOwner.username)

        // Create settings for hall owner
        await prisma.settings.create({
            data: {
                ownerId: hallOwner.id,
                companyNameAr: 'قاعة العرض التجريبي',
                companyEmail: 'demo@example.com',
                companyPhone: '0500000000',
                companyAddress: 'الرياض، المملكة العربية السعودية',
                commercialRegNo: '1234567890',
                vatRegNo: '300000000000003',
                vatPercentage: 15
            }
        })
        console.log('✅ Created settings for hall owner')

        // Create sample hall
        const hall = await prisma.hall.create({
            data: {
                nameAr: 'القاعة الرئيسية',
                capacity: 500,
                basePrice: 15000,
                ownerId: hallOwner.id,
                status: 'ACTIVE',
                description: 'قاعة واسعة للمناسبات الكبيرة',
                location: 'الطابق الأول',
                defaultSectionType: 'both',
                coffeeServerPrice: 200,
                sacrificePrice: 1800,
                waterCartonPrice: 50
            }
        })
        console.log('✅ Created sample hall:', hall.nameAr)

        // Create sample customer
        const customer = await prisma.customer.create({
            data: {
                nameAr: 'عميل تجريبي',
                phone: '0555555555',
                email: 'customer@example.com',
                idNumber: '1234567890',
                ownerId: hallOwner.id,
                createdById: hallOwner.id
            }
        })
        console.log('✅ Created sample customer:', customer.nameAr)
    } else {
        console.log('⚠️ Demo HALL_OWNER already exists')
    }

    // ============================================
    // 3. Create Team Members for Demo Hall Owner
    // ============================================
    const teamMembers = [
        { username: 'supervisor', nameAr: 'محمد المشرف', email: 'supervisor@example.com', role: 'ROOM_SUPERVISOR' },
        { username: 'accountant', nameAr: 'فاطمة المحاسبة', email: 'accountant@example.com', role: 'ACCOUNTANT' },
        { username: 'employee', nameAr: 'خالد الموظف', email: 'employee@example.com', role: 'EMPLOYEE' }
    ]

    for (const member of teamMembers) {
        const existing = await prisma.user.findUnique({
            where: { username: member.username }
        })

        if (!existing) {
            await prisma.user.create({
                data: {
                    username: member.username,
                    password: hashedPassword,
                    nameAr: member.nameAr,
                    email: member.email,
                    phone: `055${Math.random().toString().slice(2, 9)}`,
                    role: member.role,
                    status: 'ACTIVE',
                    ownerId: hallOwner.id // Connected to hall owner
                }
            })
            console.log(`✅ Created ${member.role}:`, member.username)
        } else {
            console.log(`⚠️ ${member.role} already exists:`, member.username)
        }
    }

    console.log('\n✨ Demo accounts ready!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('SUPER_ADMIN:   admin      | Password: Demo@123')
    console.log('HALL_OWNER:    demo       | Password: Demo@123')
    console.log('SUPERVISOR:    supervisor | Password: Demo@123')
    console.log('ACCOUNTANT:    accountant | Password: Demo@123')
    console.log('EMPLOYEE:      employee   | Password: Demo@123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
