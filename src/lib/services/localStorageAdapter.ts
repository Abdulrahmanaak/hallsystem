/**
 * LocalStorage Adapter for Hall Management System
 * Provides CRUD operations for entities when database is unavailable
 */

// Storage keys
export const STORAGE_KEYS = {
    HALLS: 'hallsystem_halls_data',
    BOOKINGS: 'hallsystem_bookings_data',
    CUSTOMERS: 'hallsystem_customers_data',
    DB_STATUS: 'hallsystem_db_status',
    PENDING_SYNC: 'hallsystem_pending_sync'
}

// Type definitions
export interface LocalHall {
    id: string
    name: string
    nameAr?: string
    capacity: number
    basePrice: number
    hourlyRate: number | null
    amenities: string | null
    location: string | null
    description: string | null
    status: string
    bookingsCount: number
    createdAt: string
    // Configuration Fields
    defaultCoffeeServers: number
    defaultSacrifices: number
    defaultWaterCartons: number
    coffeeServerPrice: number
    sacrificePrice: number
    waterCartonPrice: number
    extraSectionPrice: number
    // Booking Defaults
    defaultGuestCount: number
    defaultSectionType: 'men' | 'women' | 'both'
    // Meal Prices
    mealPrices: {
        dinner: number
        lunch: number
        breakfast: number
        snacks: number
    }
}

export interface LocalCustomer {
    id: string
    nameAr: string
    phone: string
    email?: string | null
    idNumber?: string | null
    customerType?: string
    createdAt: string
}

export interface LocalBooking {
    id: string
    bookingNumber: string
    customerId: string
    customerName: string
    customerPhone: string
    customerEmail?: string
    customerIdNumber?: string
    hallId: string
    hallName: string
    eventType: string
    eventDate: string
    date: string
    startTime: string
    endTime: string
    guestCount: number | null
    sectionType?: string
    mealType?: string
    services?: string[]
    coffeeServers?: number
    sacrifices?: number
    waterCartons?: number
    status: string
    totalAmount: number
    downPayment: number
    discountAmount: number
    vatAmount: number
    finalAmount: number
    serviceRevenue?: number
    servicesBreakdown?: string
    notes: string | null
    createdAt: string
}

// Default data for initial state
const DEFAULT_HALLS: LocalHall[] = [
    {
        id: 'hall-1',
        name: 'القاعة الكبرى',
        nameAr: 'القاعة الكبرى',
        capacity: 500,
        basePrice: 5000,
        hourlyRate: null,
        amenities: 'مجهزة بالكامل',
        location: 'الدور الأرضي',
        description: 'قاعة فاخرة مناسبة للأعراس والمناسبات الكبيرة',
        status: 'ACTIVE',
        bookingsCount: 0,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 10,
        defaultSacrifices: 5,
        defaultWaterCartons: 10,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 500,
        defaultSectionType: 'both',
        mealPrices: { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
    },
    {
        id: 'hall-2',
        name: 'قاعة الحديقة',
        nameAr: 'قاعة الحديقة',
        capacity: 300,
        basePrice: 3500,
        hourlyRate: null,
        amenities: 'إطلالة خارجية',
        location: 'الحديقة الخارجية',
        description: 'قاعة مفتوحة مع تشجير وإضاءة خافتة',
        status: 'ACTIVE',
        bookingsCount: 0,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 6,
        defaultSacrifices: 3,
        defaultWaterCartons: 8,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 300,
        defaultSectionType: 'both',
        mealPrices: { dinner: 120, lunch: 80, breakfast: 40, snacks: 25 }
    },
    {
        id: 'hall-3',
        name: 'الجناح الملكي',
        nameAr: 'الجناح الملكي',
        capacity: 100,
        basePrice: 1500,
        hourlyRate: null,
        amenities: 'خدمة VIP',
        location: 'الدور الثاني',
        description: 'جناح خاص للمناسبات الصغيرة والاجتماعات',
        status: 'ACTIVE',
        bookingsCount: 0,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 2,
        defaultSacrifices: 0,
        defaultWaterCartons: 4,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 100,
        defaultSectionType: 'men',
        mealPrices: { dinner: 200, lunch: 150, breakfast: 80, snacks: 50 }
    }
]

const DEFAULT_CUSTOMERS: LocalCustomer[] = [
    {
        id: 'cust-demo-1',
        nameAr: 'عميل تجريبي',
        phone: '0500000000',
        email: 'demo@example.com',
        customerType: 'INDIVIDUAL',
        createdAt: new Date().toISOString()
    }
]

// Helper functions
function getFromStorage<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue
    try {
        const stored = localStorage.getItem(key)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error(`Error reading from localStorage (${key}):`, e)
    }
    return defaultValue
}

function saveToStorage<T>(key: string, data: T): boolean {
    if (typeof window === 'undefined') return false
    try {
        localStorage.setItem(key, JSON.stringify(data))
        return true
    } catch (e) {
        console.error(`Error saving to localStorage (${key}):`, e)
        return false
    }
}

function generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

function generateBookingNumber(): string {
    const year = new Date().getFullYear()
    const bookings = getFromStorage<LocalBooking[]>(STORAGE_KEYS.BOOKINGS, [])
    const prefix = `BK-${year}-`

    // Find the highest number for this year
    let maxNumber = 0
    bookings.forEach(b => {
        if (b.bookingNumber.startsWith(prefix)) {
            const num = parseInt(b.bookingNumber.split('-')[2])
            if (num > maxNumber) maxNumber = num
        }
    })

    return `${prefix}${(maxNumber + 1).toString().padStart(4, '0')}`
}

// ==================== HALLS ====================

export const hallsAdapter = {
    getAll(): LocalHall[] {
        return getFromStorage<LocalHall[]>(STORAGE_KEYS.HALLS, DEFAULT_HALLS)
    },

    getById(id: string): LocalHall | null {
        const halls = this.getAll()
        return halls.find(h => h.id === id) || null
    },

    create(data: Partial<LocalHall>): LocalHall {
        const halls = this.getAll()
        const newHall: LocalHall = {
            id: generateId('hall'),
            name: data.nameAr || data.name || '',
            nameAr: data.nameAr || data.name || '',
            capacity: data.capacity || 0,
            basePrice: data.basePrice || 0,
            hourlyRate: data.hourlyRate || null,
            amenities: data.amenities || null,
            location: data.location || null,
            description: data.description || null,
            status: data.status || 'ACTIVE',
            bookingsCount: 0,
            createdAt: new Date().toISOString(),
            defaultCoffeeServers: data.defaultCoffeeServers || 0,
            defaultSacrifices: data.defaultSacrifices || 0,
            defaultWaterCartons: data.defaultWaterCartons || 0,
            coffeeServerPrice: data.coffeeServerPrice || 100,
            sacrificePrice: data.sacrificePrice || 1500,
            waterCartonPrice: data.waterCartonPrice || 50,
            extraSectionPrice: data.extraSectionPrice || 0,
            defaultGuestCount: data.defaultGuestCount || data.capacity || 0,
            defaultSectionType: data.defaultSectionType || 'both',
            mealPrices: data.mealPrices || { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
        }
        halls.push(newHall)
        saveToStorage(STORAGE_KEYS.HALLS, halls)
        this.markPendingSync('halls', 'create', newHall.id)
        return newHall
    },

    update(id: string, data: Partial<LocalHall>): LocalHall | null {
        const halls = this.getAll()
        const index = halls.findIndex(h => h.id === id)
        if (index === -1) return null

        halls[index] = { ...halls[index], ...data, name: data.nameAr || data.name || halls[index].name }
        saveToStorage(STORAGE_KEYS.HALLS, halls)
        this.markPendingSync('halls', 'update', id)
        return halls[index]
    },

    delete(id: string): boolean {
        const halls = this.getAll()
        const filtered = halls.filter(h => h.id !== id)
        if (filtered.length === halls.length) return false
        saveToStorage(STORAGE_KEYS.HALLS, filtered)
        this.markPendingSync('halls', 'delete', id)
        return true
    },

    markPendingSync(entity: string, action: string, id: string) {
        const pending = getFromStorage<Array<{ entity: string, action: string, id: string, timestamp: string }>>(
            STORAGE_KEYS.PENDING_SYNC, []
        )
        pending.push({ entity, action, id, timestamp: new Date().toISOString() })
        saveToStorage(STORAGE_KEYS.PENDING_SYNC, pending)
    }
}

// ==================== CUSTOMERS ====================

export const customersAdapter = {
    getAll(): LocalCustomer[] {
        return getFromStorage<LocalCustomer[]>(STORAGE_KEYS.CUSTOMERS, DEFAULT_CUSTOMERS)
    },

    getById(id: string): LocalCustomer | null {
        const customers = this.getAll()
        return customers.find(c => c.id === id) || null
    },

    findByPhone(phone: string): LocalCustomer | null {
        const customers = this.getAll()
        return customers.find(c => c.phone === phone) || null
    },

    findByIdNumber(idNumber: string): LocalCustomer | null {
        const customers = this.getAll()
        return customers.find(c => c.idNumber === idNumber) || null
    },

    create(data: Partial<LocalCustomer>): LocalCustomer {
        const customers = this.getAll()
        const newCustomer: LocalCustomer = {
            id: generateId('cust'),
            nameAr: data.nameAr || '',
            phone: data.phone || '',
            email: data.email || null,
            idNumber: data.idNumber || null,
            customerType: data.customerType || 'INDIVIDUAL',
            createdAt: new Date().toISOString()
        }
        customers.push(newCustomer)
        saveToStorage(STORAGE_KEYS.CUSTOMERS, customers)
        return newCustomer
    },

    update(id: string, data: Partial<LocalCustomer>): LocalCustomer | null {
        const customers = this.getAll()
        const index = customers.findIndex(c => c.id === id)
        if (index === -1) return null

        customers[index] = { ...customers[index], ...data }
        saveToStorage(STORAGE_KEYS.CUSTOMERS, customers)
        return customers[index]
    }
}

// ==================== BOOKINGS ====================

export const bookingsAdapter = {
    getAll(): LocalBooking[] {
        return getFromStorage<LocalBooking[]>(STORAGE_KEYS.BOOKINGS, [])
    },

    getById(id: string): LocalBooking | null {
        const bookings = this.getAll()
        return bookings.find(b => b.id === id) || null
    },

    create(data: Partial<LocalBooking> & { hallId: string }): LocalBooking {
        const bookings = this.getAll()
        const hall = hallsAdapter.getById(data.hallId)

        const newBooking: LocalBooking = {
            id: generateId('bk'),
            bookingNumber: generateBookingNumber(),
            customerId: data.customerId || '',
            customerName: data.customerName || '',
            customerPhone: data.customerPhone || '',
            customerEmail: data.customerEmail,
            customerIdNumber: data.customerIdNumber,
            hallId: data.hallId,
            hallName: hall?.name || data.hallName || '',
            eventType: data.eventType || 'WEDDING',
            eventDate: data.eventDate || data.date || new Date().toISOString(),
            date: data.date || data.eventDate?.split('T')[0] || new Date().toISOString().split('T')[0],
            startTime: data.startTime || '16:00',
            endTime: data.endTime || '23:00',
            guestCount: data.guestCount || null,
            sectionType: data.sectionType,
            mealType: data.mealType,
            services: data.services,
            coffeeServers: data.coffeeServers,
            sacrifices: data.sacrifices,
            waterCartons: data.waterCartons,
            status: data.status || 'TENTATIVE',
            totalAmount: data.totalAmount || 0,
            downPayment: data.downPayment || 0,
            discountAmount: data.discountAmount || 0,
            vatAmount: data.vatAmount || 0,
            finalAmount: data.finalAmount || data.totalAmount || 0,
            serviceRevenue: data.serviceRevenue,
            servicesBreakdown: data.servicesBreakdown,
            notes: data.notes || null,
            createdAt: new Date().toISOString()
        }

        bookings.push(newBooking)
        saveToStorage(STORAGE_KEYS.BOOKINGS, bookings)

        // Update hall booking count
        if (hall) {
            hallsAdapter.update(hall.id, { bookingsCount: (hall.bookingsCount || 0) + 1 })
        }

        return newBooking
    },

    update(id: string, data: Partial<LocalBooking>): LocalBooking | null {
        const bookings = this.getAll()
        const index = bookings.findIndex(b => b.id === id)
        if (index === -1) return null

        bookings[index] = { ...bookings[index], ...data }
        saveToStorage(STORAGE_KEYS.BOOKINGS, bookings)
        return bookings[index]
    },

    updateStatus(id: string, status: string): LocalBooking | null {
        return this.update(id, { status })
    },

    delete(id: string): boolean {
        const bookings = this.getAll()
        const booking = bookings.find(b => b.id === id)
        if (!booking) return false

        const filtered = bookings.filter(b => b.id !== id)
        saveToStorage(STORAGE_KEYS.BOOKINGS, filtered)

        // Update hall booking count
        const hall = hallsAdapter.getById(booking.hallId)
        if (hall && hall.bookingsCount > 0) {
            hallsAdapter.update(hall.id, { bookingsCount: hall.bookingsCount - 1 })
        }

        return true
    }
}

// ==================== UTILITY ====================

export const storageUtils = {
    getDbStatus(): { isConnected: boolean, lastCheck: string | null } {
        return getFromStorage(STORAGE_KEYS.DB_STATUS, { isConnected: true, lastCheck: null })
    },

    setDbStatus(isConnected: boolean) {
        saveToStorage(STORAGE_KEYS.DB_STATUS, { isConnected, lastCheck: new Date().toISOString() })
    },

    getPendingSyncItems() {
        return getFromStorage<Array<{ entity: string, action: string, id: string, timestamp: string }>>(
            STORAGE_KEYS.PENDING_SYNC, []
        )
    },

    clearPendingSync() {
        saveToStorage(STORAGE_KEYS.PENDING_SYNC, [])
    },

    clearAll() {
        if (typeof window === 'undefined') return
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key)
        })
    }
}
