import 'dotenv/config'
import { PrismaClient } from '../prisma/generated/prisma/client.js'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

async function main() {
    const apiKey = '07ef494508aefabed688ff444'

    console.log('Updating Qoyod API Key...')

    await prisma.settings.upsert({
        where: { id: 'system' },
        update: {
            qoyodEnabled: true,
            qoyodApiKey: apiKey
        },
        create: {
            id: 'system',
            companyNameAr: 'نظام إدارة القاعات',
            qoyodEnabled: true,
            qoyodApiKey: apiKey,
            vatPercentage: 15
        }
    })

    console.log('API Key updated successfully!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
