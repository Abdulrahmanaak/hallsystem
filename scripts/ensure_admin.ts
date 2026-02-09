
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('Ensuring Super Admin exists...')

    const hashedPassword = await bcrypt.hash('Admin@123', 10)

    const admin = await prisma.user.upsert({
        where: { username: 'superadmin' },
        update: {},
        create: {
            username: 'superadmin',
            password: hashedPassword,
            nameAr: 'مدير النظام',
            role: 'SUPER_ADMIN',
            status: 'ACTIVE',
            email: 'admin@system.com',
            phone: '0500000000'
        }
    })

    console.log('Super Admin ensured:', admin.username)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
