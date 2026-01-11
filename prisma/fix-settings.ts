import { prisma } from '../src/lib/prisma'

async function fixSettings() {
    // Delete settings entries with null ownerId
    const result = await prisma.$executeRaw`DELETE FROM settings WHERE "ownerId" IS NULL`
    console.log('Deleted settings with null ownerId:', result)

    await prisma.$disconnect()
}

fixSettings()
    .catch((e) => {
        console.error('Error:', e)
        process.exit(1)
    })
