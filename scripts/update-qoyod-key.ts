import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

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
