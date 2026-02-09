
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🔄 activating 7-day trial for existing Hall Owners...')

    const sevenDaysFromNow = new Date()
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

    const result = await prisma.user.updateMany({
        where: {
            role: 'HALL_OWNER',
            subscriptionStatus: 'TRIAL', // Reset all trial users
        },
        data: {
            trialEndsAt: sevenDaysFromNow,
            subscriptionStatus: 'TRIAL', // Ensure status is set
            subscriptionEndsAt: null,
        }
    })

    console.log(`✅ Updated ${result.count} existing Hall Owners with a fresh 7-day trial.`)
    console.log(`📅 Trial ends at: ${sevenDaysFromNow.toISOString()}`)
}

main()
    .catch(e => {
        console.error('❌ Error activating trials:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
