
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🔍 Verifying trial status...')

    // Check Hall Owners
    const owners = await prisma.user.findMany({
        where: { role: 'HALL_OWNER' },
        select: { username: true, trialEndsAt: true, subscriptionStatus: true }
    })

    console.log('Hall Owners Trial Status:', owners)
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
