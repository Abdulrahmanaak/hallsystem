import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Verifying Qoyod Fix...')

    // 1. Get an invoice
    const invoice = await prisma.invoice.findFirst({
        orderBy: { createdAt: 'desc' }
    })

    if (!invoice) {
        console.error('No invoice found to test sync')
        return
    }

    console.log(`Testing Sync for Invoice: ${invoice.invoiceNumber} (ID: ${invoice.id})`)

    // 2. Call API
    try {
        const res = await fetch('http://localhost:3000/api/qoyod', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'invoice',
                id: invoice.id
            })
        })

        const data = await res.json()
        console.log('Status:', res.status)
        console.log('Response:', JSON.stringify(data, null, 2))

        if (res.ok) {
            console.log('SUCCESS: Invoice synced!')
        } else {
            console.error('FAILED: Sync failed')
        }

    } catch (e) {
        console.error('Request failed:', e)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
