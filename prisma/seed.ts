import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('🌱 Starting database seed...')

    // Clean existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Cleaning existing data...')
    await prisma.payment.deleteMany()
    await prisma.invoice.deleteMany()
    await prisma.bookingStatusHistory.deleteMany()
    await prisma.booking.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.hall.deleteMany()
    await prisma.accountingSync.deleteMany()
    await prisma.settings.deleteMany()
    await prisma.user.deleteMany()

    // Create Hall Owner (with password: "password123")
    console.log('👥 Creating hall owner...')
    const hashedPassword = await bcrypt.hash('password123', 10)

    const hallOwner = await prisma.user.create({
        data: {
            username: 'admin',
            password: hashedPassword,
            nameAr: 'قاعة النخبة للمناسبات',
            email: 'admin@hallsystem.com',
            phone: '0501234567',
            role: 'HALL_OWNER',
            status: 'ACTIVE',
            ownerId: null, // Hall owners have null ownerId
            commercialRegNo: '1234567890',
            vatRegNo: '300123456789003'
        }
    })

    // Create team members for this hall owner
    const supervisorUser = await prisma.user.create({
        data: {
            username: 'supervisor',
            password: hashedPassword,
            nameAr: 'محمد المشرف',
            email: 'supervisor@hallsystem.com',
            phone: '0507654321',
            role: 'ROOM_SUPERVISOR',
            status: 'ACTIVE',
            ownerId: hallOwner.id // Team member belongs to hall owner
        }
    })

    const accountantUser = await prisma.user.create({
        data: {
            username: 'accountant',
            password: hashedPassword,
            nameAr: 'فاطمة المحاسبة',
            email: 'accountant@hallsystem.com',
            phone: '0509876543',
            role: 'ACCOUNTANT',
            status: 'ACTIVE',
            ownerId: hallOwner.id
        }
    })

    const employeeUser = await prisma.user.create({
        data: {
            username: 'employee',
            password: hashedPassword,
            nameAr: 'خالد الموظف',
            email: 'employee@hallsystem.com',
            phone: '0502345678',
            role: 'EMPLOYEE',
            status: 'ACTIVE',
            ownerId: hallOwner.id
        }
    })

    console.log('✅ Created hall owner + 3 team members (supervisor, accountant, employee)')

    // Create System Settings for Hall Owner
    console.log('⚙️  Creating settings...')
    await prisma.settings.create({
        data: {
            ownerId: hallOwner.id,
            companyNameAr: 'قاعة النخبة للمناسبات',
            companyPhone: '0112345678',
            companyEmail: 'info@alnukhba.com',
            commercialRegNo: '1234567890',
            vatRegNo: '300123456789003',
            vatPercentage: 15,
            qoyodEnabled: false
        }
    })

    console.log('✅ Settings created')

    // Create Halls (owned by hall owner)
    console.log('🏛️  Creating halls...')
    const hall1 = await prisma.hall.create({
        data: {
            nameAr: 'القاعة الملكية',
            capacity: 500,
            basePrice: 15000,
            hourlyRate: 2000,
            ownerId: hallOwner.id,
            amenities: JSON.stringify({
                chairs: true,
                tables: true,
                sound: true,
                lighting: true,
                airConditioning: true,
                parking: true
            }),
            location: 'الدور الأول',
            description: 'قاعة فاخرة مناسبة للأعراس والمناسبات الكبيرة',
            status: 'ACTIVE'
        }
    })

    const hall2 = await prisma.hall.create({
        data: {
            nameAr: 'قاعة الياسمين',
            capacity: 300,
            basePrice: 10000,
            hourlyRate: 1500,
            ownerId: hallOwner.id,
            amenities: JSON.stringify({
                chairs: true,
                tables: true,
                sound: true,
                lighting: true,
                airConditioning: true
            }),
            location: 'الدور الثاني',
            description: 'قاعة مثالية للمناسبات المتوسطة',
            status: 'ACTIVE'
        }
    })

    const hall3 = await prisma.hall.create({
        data: {
            nameAr: 'قاعة الورد',
            capacity: 150,
            basePrice: 7000,
            hourlyRate: 1000,
            ownerId: hallOwner.id,
            amenities: JSON.stringify({
                chairs: true,
                tables: true,
                sound: true,
                lighting: true
            }),
            location: 'الدور الأول',
            description: 'قاعة مناسبة للمناسبات الخاصة والحميمة',
            status: 'ACTIVE'
        }
    })

    console.log('✅ Created 3 halls')

    // Create Customers (owned by hall owner)
    console.log('👥 Creating customers...')
    const customer1 = await prisma.customer.create({
        data: {
            nameAr: 'عبدالله بن سعود',
            phone: '0551234567',
            email: 'abdullah@example.com',
            idNumber: '1234567890',
            address: 'الرياض، حي النخيل',
            customerType: 'INDIVIDUAL',
            ownerId: hallOwner.id,
            createdById: hallOwner.id
        }
    })

    const customer2 = await prisma.customer.create({
        data: {
            nameAr: 'شركة الأفراح المتميزة',
            phone: '0557654321',
            email: 'events@company.com',
            idNumber: '9876543210',
            address: 'جدة، حي الزهراء',
            customerType: 'COMPANY',
            ownerId: hallOwner.id,
            createdById: supervisorUser.id
        }
    })

    const customer3 = await prisma.customer.create({
        data: {
            nameAr: 'سارة أحمد',
            phone: '0559876543',
            email: 'sara@example.com',
            idNumber: '5432167890',
            address: 'الدمام، حي الفيصلية',
            customerType: 'INDIVIDUAL',
            ownerId: hallOwner.id,
            createdById: employeeUser.id
        }
    })

    console.log('✅ Created 3 customers')

    // Create Bookings (past, current, and future)
    console.log('📅 Creating bookings...')

    // Past booking (completed)
    const pastDate = new Date('2024-11-15')
    const pastBooking = await prisma.booking.create({
        data: {
            bookingNumber: 'BK-2024-0001',
            customerId: customer1.id,
            hallId: hall1.id,
            ownerId: hallOwner.id,
            eventType: 'WEDDING',
            eventDate: pastDate,
            startTime: new Date('2024-11-15T17:00:00'),
            endTime: new Date('2024-11-15T23:00:00'),
            guestCount: 450,
            totalAmount: 15000,
            discountAmount: 0,
            vatAmount: 2250, // 15%
            finalAmount: 17250,
            status: 'COMPLETED',
            createdById: supervisorUser.id,
            notes: 'حفل زفاف كبير'
        }
    })

    // Create invoice and payment for past booking
    const pastInvoice = await prisma.invoice.create({
        data: {
            invoiceNumber: 'INV-2024-0001',
            bookingId: pastBooking.id,
            customerId: customer1.id,
            ownerId: hallOwner.id,
            subtotal: 15000,
            discountAmount: 0,
            vatAmount: 2250,
            totalAmount: 17250,
            paidAmount: 17250,
            issueDate: new Date('2024-11-10'),
            dueDate: new Date('2024-11-15'),
            status: 'PAID',
            createdById: accountantUser.id
        }
    })

    await prisma.payment.create({
        data: {
            paymentNumber: 'PAY-2024-0001',
            bookingId: pastBooking.id,
            invoiceId: pastInvoice.id,
            ownerId: hallOwner.id,
            amount: 17250,
            paymentMethod: 'BANK_TRANSFER',
            paymentDate: new Date('2024-11-14'),
            createdById: accountantUser.id
        }
    })

    // Current booking (confirmed, upcoming)
    const upcomingDate = new Date()
    upcomingDate.setDate(upcomingDate.getDate() + 7) // 7 days from now

    const upcomingBooking = await prisma.booking.create({
        data: {
            bookingNumber: 'BK-2024-0002',
            customerId: customer2.id,
            hallId: hall2.id,
            ownerId: hallOwner.id,
            eventType: 'CONFERENCE',
            eventDate: upcomingDate,
            startTime: new Date(upcomingDate.getTime()),
            endTime: new Date(upcomingDate.getTime() + 6 * 60 * 60 * 1000), // +6 hours
            guestCount: 250,
            totalAmount: 10000,
            discountAmount: 500,
            vatAmount: 1425, // 15% of (10000-500)
            finalAmount: 10925,
            status: 'CONFIRMED',
            createdById: supervisorUser.id,
            notes: 'مؤتمر شركة - يحتاج معدات صوت إضافية'
        }
    })

    await prisma.invoice.create({
        data: {
            invoiceNumber: 'INV-2024-0002',
            bookingId: upcomingBooking.id,
            customerId: customer2.id,
            ownerId: hallOwner.id,
            subtotal: 10000,
            discountAmount: 500,
            vatAmount: 1425,
            totalAmount: 10925,
            paidAmount: 5000,
            issueDate: new Date(),
            dueDate: upcomingDate,
            status: 'PARTIALLY_PAID',
            createdById: accountantUser.id
        }
    })

    // Pending booking (awaiting confirmation)
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 21) // 21 days from now

    await prisma.booking.create({
        data: {
            bookingNumber: 'BK-2024-0003',
            customerId: customer3.id,
            hallId: hall3.id,
            ownerId: hallOwner.id,
            eventType: 'BIRTHDAY',
            eventDate: futureDate,
            startTime: new Date(futureDate.getTime()),
            endTime: new Date(futureDate.getTime() + 4 * 60 * 60 * 1000), // +4 hours
            guestCount: 100,
            totalAmount: 7000,
            discountAmount: 0,
            vatAmount: 1050,
            finalAmount: 8050,
            status: 'PENDING',
            createdById: employeeUser.id,
            notes: 'حفل عيد ميلاد - عميل جديد'
        }
    })

    console.log('✅ Created 3 bookings with invoices and payments')

    console.log('\n✨ Seed completed successfully!\n')
    console.log('📋 Login credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Hall Owner: username: admin      | password: password123')
    console.log('Supervisor: username: supervisor | password: password123')
    console.log('Accountant: username: accountant | password: password123')
    console.log('Employee:   username: employee   | password: password123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
    .catch((e) => {
        console.error('❌ Error during seed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
