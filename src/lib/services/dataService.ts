/**
 * Data Service Layer for Hall Management System
 * Provides database operations with automatic localStorage fallback
 */

import { prisma } from '@/lib/prisma'
import {
    hallsAdapter,
    customersAdapter,
    bookingsAdapter,
    storageUtils
} from './localStorageAdapter'
import type {
    LocalHall,
    LocalCustomer,
    LocalBooking
} from './localStorageAdapter'


// Cache for DB connection status
let dbConnectionStatus: boolean | null = null
let lastConnectionCheck: number = 0
const CONNECTION_CHECK_INTERVAL = 30000 // 30 seconds

/**
 * Check if the database is available
 */
export async function isDbAvailable(): Promise<boolean> {
    // Use cached status if checked recently
    const now = Date.now()
    if (dbConnectionStatus !== null && (now - lastConnectionCheck) < CONNECTION_CHECK_INTERVAL) {
        return dbConnectionStatus
    }

    try {
        // Try a simple query to check connection
        await prisma.$queryRaw`SELECT 1`
        dbConnectionStatus = true
        lastConnectionCheck = now
        storageUtils.setDbStatus(true)
        return true
    } catch (error) {
        console.warn('Database connection check failed:', error)
        dbConnectionStatus = false
        lastConnectionCheck = now
        storageUtils.setDbStatus(false)
        return false
    }
}

/**
 * Force refresh the connection status
 */
export async function refreshConnectionStatus(): Promise<boolean> {
    dbConnectionStatus = null
    return isDbAvailable()
}

// ==================== HALLS SERVICE ====================

export const hallsService = {
    async getAll(): Promise<LocalHall[]> {
        if (await isDbAvailable()) {
            try {
                const halls = await prisma.hall.findMany({
                    where: { isDeleted: false },
                    include: { _count: { select: { bookings: true } } },
                    orderBy: { nameAr: 'asc' }
                })

                return halls.map(hall => ({
                    id: hall.id,
                    name: hall.nameAr,
                    nameAr: hall.nameAr,
                    capacity: hall.capacity,
                    basePrice: Number(hall.basePrice),
                    hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
                    amenities: hall.amenities,
                    location: hall.location,
                    description: hall.description,
                    status: hall.status,
                    bookingsCount: hall._count.bookings,
                    createdAt: hall.createdAt.toISOString(),
                    defaultCoffeeServers: hall.defaultCoffeeServers || 0,
                    defaultSacrifices: hall.defaultSacrifices || 0,
                    defaultWaterCartons: hall.defaultWaterCartons || 0,
                    coffeeServerPrice: hall.coffeeServerPrice ? Number(hall.coffeeServerPrice) : 100,
                    sacrificePrice: hall.sacrificePrice ? Number(hall.sacrificePrice) : 1500,
                    waterCartonPrice: hall.waterCartonPrice ? Number(hall.waterCartonPrice) : 50,
                    extraSectionPrice: hall.extraSectionPrice ? Number(hall.extraSectionPrice) : 0,
                    defaultGuestCount: hall.defaultGuestCount || hall.capacity,
                    defaultSectionType: (hall.defaultSectionType as 'men' | 'women' | 'both') || 'both',
                    mealPrices: hall.mealPrices ? JSON.parse(hall.mealPrices) : { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
                }))
            } catch (error) {
                console.error('Error fetching halls from DB, falling back to localStorage:', error)
                return hallsAdapter.getAll()
            }
        }
        return hallsAdapter.getAll()
    },

    async getById(id: string): Promise<LocalHall | null> {
        if (await isDbAvailable()) {
            try {
                const hall = await prisma.hall.findUnique({
                    where: { id },
                    include: { _count: { select: { bookings: true } } }
                })
                if (!hall) return null

                return {
                    id: hall.id,
                    name: hall.nameAr,
                    nameAr: hall.nameAr,
                    capacity: hall.capacity,
                    basePrice: Number(hall.basePrice),
                    hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
                    amenities: hall.amenities,
                    location: hall.location,
                    description: hall.description,
                    status: hall.status,
                    bookingsCount: hall._count.bookings,
                    createdAt: hall.createdAt.toISOString(),
                    defaultCoffeeServers: hall.defaultCoffeeServers || 0,
                    defaultSacrifices: hall.defaultSacrifices || 0,
                    defaultWaterCartons: hall.defaultWaterCartons || 0,
                    coffeeServerPrice: hall.coffeeServerPrice ? Number(hall.coffeeServerPrice) : 100,
                    sacrificePrice: hall.sacrificePrice ? Number(hall.sacrificePrice) : 1500,
                    waterCartonPrice: hall.waterCartonPrice ? Number(hall.waterCartonPrice) : 50,
                    extraSectionPrice: hall.extraSectionPrice ? Number(hall.extraSectionPrice) : 0,
                    defaultGuestCount: hall.defaultGuestCount || hall.capacity,
                    defaultSectionType: (hall.defaultSectionType as 'men' | 'women' | 'both') || 'both',
                    mealPrices: hall.mealPrices ? JSON.parse(hall.mealPrices) : { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
                }
            } catch (error) {
                console.error('Error fetching hall from DB:', error)
                return hallsAdapter.getById(id)
            }
        }
        return hallsAdapter.getById(id)
    },

    async create(data: Partial<LocalHall>): Promise<LocalHall> {
        if (await isDbAvailable()) {
            try {
                const hall = await prisma.hall.create({
                    data: {
                        nameAr: data.nameAr || data.name || '',
                        capacity: data.capacity || 0,
                        basePrice: data.basePrice || 0,
                        hourlyRate: data.hourlyRate || null,
                        amenities: data.amenities || null,
                        location: data.location || null,
                        description: data.description || null,
                        status: data.status || 'ACTIVE',
                        defaultCoffeeServers: data.defaultCoffeeServers || 0,
                        defaultSacrifices: data.defaultSacrifices || 0,
                        defaultWaterCartons: data.defaultWaterCartons || 0,
                        coffeeServerPrice: data.coffeeServerPrice || 100,
                        sacrificePrice: data.sacrificePrice || 1500,
                        waterCartonPrice: data.waterCartonPrice || 50,
                        extraSectionPrice: data.extraSectionPrice || 0,
                        defaultGuestCount: data.defaultGuestCount || null,
                        defaultSectionType: data.defaultSectionType || 'both',
                        mealPrices: data.mealPrices ? JSON.stringify(data.mealPrices) : null
                    }
                })

                return {
                    id: hall.id,
                    name: hall.nameAr,
                    nameAr: hall.nameAr,
                    capacity: hall.capacity,
                    basePrice: Number(hall.basePrice),
                    hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
                    amenities: hall.amenities,
                    location: hall.location,
                    description: hall.description,
                    status: hall.status,
                    bookingsCount: 0,
                    createdAt: hall.createdAt.toISOString(),
                    defaultCoffeeServers: hall.defaultCoffeeServers || 0,
                    defaultSacrifices: hall.defaultSacrifices || 0,
                    defaultWaterCartons: hall.defaultWaterCartons || 0,
                    coffeeServerPrice: hall.coffeeServerPrice ? Number(hall.coffeeServerPrice) : 100,
                    sacrificePrice: hall.sacrificePrice ? Number(hall.sacrificePrice) : 1500,
                    waterCartonPrice: hall.waterCartonPrice ? Number(hall.waterCartonPrice) : 50,
                    extraSectionPrice: hall.extraSectionPrice ? Number(hall.extraSectionPrice) : 0,
                    defaultGuestCount: hall.defaultGuestCount || hall.capacity,
                    defaultSectionType: (hall.defaultSectionType as 'men' | 'women' | 'both') || 'both',
                    mealPrices: hall.mealPrices ? JSON.parse(hall.mealPrices) : { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
                }
            } catch (error) {
                console.error('Error creating hall in DB, falling back to localStorage:', error)
                return hallsAdapter.create(data)
            }
        }
        return hallsAdapter.create(data)
    },

    async update(id: string, data: Partial<LocalHall>): Promise<LocalHall | null> {
        if (await isDbAvailable()) {
            try {
                const hall = await prisma.hall.update({
                    where: { id },
                    data: {
                        nameAr: data.nameAr || data.name,
                        capacity: data.capacity,
                        basePrice: data.basePrice,
                        hourlyRate: data.hourlyRate,
                        amenities: data.amenities,
                        location: data.location,
                        description: data.description,
                        status: data.status,
                        defaultCoffeeServers: data.defaultCoffeeServers,
                        defaultSacrifices: data.defaultSacrifices,
                        defaultWaterCartons: data.defaultWaterCartons,
                        coffeeServerPrice: data.coffeeServerPrice,
                        sacrificePrice: data.sacrificePrice,
                        waterCartonPrice: data.waterCartonPrice,
                        extraSectionPrice: data.extraSectionPrice,
                        defaultGuestCount: data.defaultGuestCount,
                        defaultSectionType: data.defaultSectionType,
                        mealPrices: data.mealPrices ? JSON.stringify(data.mealPrices) : undefined
                    }
                })

                return {
                    id: hall.id,
                    name: hall.nameAr,
                    nameAr: hall.nameAr,
                    capacity: hall.capacity,
                    basePrice: Number(hall.basePrice),
                    hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
                    amenities: hall.amenities,
                    location: hall.location,
                    description: hall.description,
                    status: hall.status,
                    bookingsCount: 0,
                    createdAt: hall.createdAt.toISOString(),
                    defaultCoffeeServers: hall.defaultCoffeeServers || 0,
                    defaultSacrifices: hall.defaultSacrifices || 0,
                    defaultWaterCartons: hall.defaultWaterCartons || 0,
                    coffeeServerPrice: hall.coffeeServerPrice ? Number(hall.coffeeServerPrice) : 100,
                    sacrificePrice: hall.sacrificePrice ? Number(hall.sacrificePrice) : 1500,
                    waterCartonPrice: hall.waterCartonPrice ? Number(hall.waterCartonPrice) : 50,
                    extraSectionPrice: hall.extraSectionPrice ? Number(hall.extraSectionPrice) : 0,
                    defaultGuestCount: hall.defaultGuestCount || hall.capacity,
                    defaultSectionType: (hall.defaultSectionType as 'men' | 'women' | 'both') || 'both',
                    mealPrices: hall.mealPrices ? JSON.parse(hall.mealPrices) : { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
                }
            } catch (error) {
                console.error('Error updating hall in DB:', error)
                return hallsAdapter.update(id, data)
            }
        }
        return hallsAdapter.update(id, data)
    }
}

// ==================== CUSTOMERS SERVICE ====================

export const customersService = {
    async getAll(): Promise<LocalCustomer[]> {
        if (await isDbAvailable()) {
            try {
                const customers = await prisma.customer.findMany({
                    where: { isDeleted: false },
                    orderBy: { nameAr: 'asc' }
                })

                return customers.map(c => ({
                    id: c.id,
                    nameAr: c.nameAr,
                    phone: c.phone,
                    email: c.email,
                    idNumber: c.idNumber,
                    customerType: c.customerType,
                    createdAt: c.createdAt.toISOString()
                }))
            } catch (error) {
                console.error('Error fetching customers from DB:', error)
                return customersAdapter.getAll()
            }
        }
        return customersAdapter.getAll()
    },

    async findByPhone(phone: string): Promise<LocalCustomer | null> {
        if (await isDbAvailable()) {
            try {
                const customer = await prisma.customer.findFirst({
                    where: { phone }
                })
                if (!customer) return null

                return {
                    id: customer.id,
                    nameAr: customer.nameAr,
                    phone: customer.phone,
                    email: customer.email,
                    idNumber: customer.idNumber,
                    customerType: customer.customerType,
                    createdAt: customer.createdAt.toISOString()
                }
            } catch (error) {
                console.error('Error finding customer by phone:', error)
                return customersAdapter.findByPhone(phone)
            }
        }
        return customersAdapter.findByPhone(phone)
    },

    async findByIdNumber(idNumber: string): Promise<LocalCustomer | null> {
        if (await isDbAvailable()) {
            try {
                const customer = await prisma.customer.findFirst({
                    where: { idNumber }
                })
                if (!customer) return null

                return {
                    id: customer.id,
                    nameAr: customer.nameAr,
                    phone: customer.phone,
                    email: customer.email,
                    idNumber: customer.idNumber,
                    customerType: customer.customerType,
                    createdAt: customer.createdAt.toISOString()
                }
            } catch (error) {
                console.error('Error finding customer by ID number:', error)
                return customersAdapter.findByIdNumber(idNumber)
            }
        }
        return customersAdapter.findByIdNumber(idNumber)
    },

    async create(data: Partial<LocalCustomer>, createdById?: string): Promise<LocalCustomer> {
        if (await isDbAvailable()) {
            try {
                // Get system user for createdById
                let userId = createdById
                if (!userId) {
                    const user = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
                    userId = user?.id
                }

                const customer = await prisma.customer.create({
                    data: {
                        nameAr: data.nameAr || '',
                        phone: data.phone || '',
                        email: data.email || null,
                        idNumber: data.idNumber || null,
                        customerType: data.customerType || 'INDIVIDUAL',
                        createdById: userId || 'system'
                    }
                })

                return {
                    id: customer.id,
                    nameAr: customer.nameAr,
                    phone: customer.phone,
                    email: customer.email,
                    idNumber: customer.idNumber,
                    customerType: customer.customerType,
                    createdAt: customer.createdAt.toISOString()
                }
            } catch (error) {
                console.error('Error creating customer in DB:', error)
                return customersAdapter.create(data)
            }
        }
        return customersAdapter.create(data)
    }
}

// ==================== BOOKINGS SERVICE ====================

export const bookingsService = {
    async getAll(): Promise<LocalBooking[]> {
        if (await isDbAvailable()) {
            try {
                const bookings = await prisma.booking.findMany({
                    where: { isDeleted: false },
                    include: {
                        hall: { select: { id: true, nameAr: true } },
                        customer: { select: { id: true, nameAr: true, phone: true, email: true, idNumber: true } }
                    },
                    orderBy: { eventDate: 'desc' }
                })

                return bookings.map(booking => ({
                    id: booking.id,
                    bookingNumber: booking.bookingNumber,
                    customerId: booking.customerId,
                    customerName: booking.customer.nameAr,
                    customerPhone: booking.customer.phone,
                    customerEmail: booking.customer.email || undefined,
                    customerIdNumber: booking.customer.idNumber || undefined,
                    hallId: booking.hallId,
                    hallName: booking.hall.nameAr,
                    eventType: booking.eventType,
                    eventDate: booking.eventDate.toISOString(),
                    date: booking.eventDate.toISOString().split('T')[0],
                    startTime: booking.startTime.toISOString().split('T')[1].substring(0, 5),
                    endTime: booking.endTime.toISOString().split('T')[1].substring(0, 5),
                    guestCount: booking.guestCount,
                    sectionType: booking.sectionType || undefined,
                    mealType: booking.mealType || undefined,
                    services: booking.services ? JSON.parse(booking.services) : undefined,
                    coffeeServers: booking.coffeeServers || undefined,
                    sacrifices: booking.sacrifices || undefined,
                    waterCartons: booking.waterCartons || undefined,
                    status: booking.status,
                    totalAmount: Number(booking.totalAmount),
                    downPayment: Number(booking.downPayment),
                    discountAmount: Number(booking.discountAmount),
                    vatAmount: Number(booking.vatAmount),
                    finalAmount: Number(booking.finalAmount),
                    serviceRevenue: Number(booking.serviceRevenue) || undefined,
                    servicesBreakdown: booking.servicesBreakdown || undefined,
                    notes: booking.notes,
                    createdAt: booking.createdAt.toISOString()
                }))
            } catch (error) {
                console.error('Error fetching bookings from DB:', error)
                return bookingsAdapter.getAll()
            }
        }
        return bookingsAdapter.getAll()
    },

    async getById(id: string): Promise<LocalBooking | null> {
        if (await isDbAvailable()) {
            try {
                const booking = await prisma.booking.findUnique({
                    where: { id },
                    include: {
                        hall: { select: { id: true, nameAr: true } },
                        customer: { select: { id: true, nameAr: true, phone: true, email: true, idNumber: true } }
                    }
                })
                if (!booking) return null

                return {
                    id: booking.id,
                    bookingNumber: booking.bookingNumber,
                    customerId: booking.customerId,
                    customerName: booking.customer.nameAr,
                    customerPhone: booking.customer.phone,
                    customerEmail: booking.customer.email || undefined,
                    customerIdNumber: booking.customer.idNumber || undefined,
                    hallId: booking.hallId,
                    hallName: booking.hall.nameAr,
                    eventType: booking.eventType,
                    eventDate: booking.eventDate.toISOString(),
                    date: booking.eventDate.toISOString().split('T')[0],
                    startTime: booking.startTime.toISOString().split('T')[1].substring(0, 5),
                    endTime: booking.endTime.toISOString().split('T')[1].substring(0, 5),
                    guestCount: booking.guestCount,
                    sectionType: booking.sectionType || undefined,
                    mealType: booking.mealType || undefined,
                    services: booking.services ? JSON.parse(booking.services) : undefined,
                    coffeeServers: booking.coffeeServers || undefined,
                    sacrifices: booking.sacrifices || undefined,
                    waterCartons: booking.waterCartons || undefined,
                    status: booking.status,
                    totalAmount: Number(booking.totalAmount),
                    downPayment: Number(booking.downPayment),
                    discountAmount: Number(booking.discountAmount),
                    vatAmount: Number(booking.vatAmount),
                    finalAmount: Number(booking.finalAmount),
                    serviceRevenue: Number(booking.serviceRevenue) || undefined,
                    servicesBreakdown: booking.servicesBreakdown || undefined,
                    notes: booking.notes,
                    createdAt: booking.createdAt.toISOString()
                }
            } catch (error) {
                console.error('Error fetching booking from DB:', error)
                return bookingsAdapter.getById(id)
            }
        }
        return bookingsAdapter.getById(id)
    },

    async updateStatus(id: string, status: string): Promise<LocalBooking | null> {
        if (await isDbAvailable()) {
            try {
                const booking = await prisma.booking.update({
                    where: { id },
                    data: { status },
                    include: {
                        hall: { select: { id: true, nameAr: true } },
                        customer: { select: { id: true, nameAr: true, phone: true, email: true, idNumber: true } }
                    }
                })

                return {
                    id: booking.id,
                    bookingNumber: booking.bookingNumber,
                    customerId: booking.customerId,
                    customerName: booking.customer.nameAr,
                    customerPhone: booking.customer.phone,
                    hallId: booking.hallId,
                    hallName: booking.hall.nameAr,
                    eventType: booking.eventType,
                    eventDate: booking.eventDate.toISOString(),
                    date: booking.eventDate.toISOString().split('T')[0],
                    startTime: booking.startTime.toISOString().split('T')[1].substring(0, 5),
                    endTime: booking.endTime.toISOString().split('T')[1].substring(0, 5),
                    guestCount: booking.guestCount,
                    status: booking.status,
                    totalAmount: Number(booking.totalAmount),
                    downPayment: Number(booking.downPayment),
                    discountAmount: Number(booking.discountAmount),
                    vatAmount: Number(booking.vatAmount),
                    finalAmount: Number(booking.finalAmount),
                    notes: booking.notes,
                    createdAt: booking.createdAt.toISOString()
                }
            } catch (error) {
                console.error('Error updating booking status in DB:', error)
                return bookingsAdapter.updateStatus(id, status)
            }
        }
        return bookingsAdapter.updateStatus(id, status)
    },

    async delete(id: string): Promise<boolean> {
        if (await isDbAvailable()) {
            try {
                await prisma.booking.update({
                    where: { id },
                    data: { isDeleted: true }
                })
                return true
            } catch (error) {
                console.error('Error deleting booking from DB:', error)
                return bookingsAdapter.delete(id)
            }
        }
        return bookingsAdapter.delete(id)
    }
}

// Export unified data service
export const dataService = {
    isDbAvailable,
    refreshConnectionStatus,
    halls: hallsService,
    customers: customersService,
    bookings: bookingsService,
    storage: storageUtils
}
