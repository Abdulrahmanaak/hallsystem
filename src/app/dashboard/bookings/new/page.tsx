"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useSubscription } from "@/hooks/useSubscription"
import { bookingService } from "@/lib/services/booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { ArrowLeft, Save, Calendar as CalendarIcon, Check, Calculator, Lock } from "lucide-react"
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// --- LocalStorage Key (must match halls page) ---
const HALLS_STORAGE_KEY = 'hallsystem_halls_data'

// --- Types matching Hall page ---
interface MealPrices {
    dinner: number
    lunch: number
    breakfast: number
    snacks: number
}

interface Hall {
    id: string
    name: string
    capacity: number
    basePrice: number
    hourlyRate: number | null
    amenities: string | null
    location: string | null
    description: string | null
    status: string
    bookingsCount: number
    createdAt: string
    defaultCoffeeServers: number
    defaultSacrifices: number
    defaultWaterCartons: number
    coffeeServerPrice: number
    sacrificePrice: number
    waterCartonPrice: number
    extraSectionPrice: number
    defaultGuestCount: number
    defaultSectionType: 'men' | 'women' | 'both'
    mealPrices: MealPrices
}

// --- Default Halls (fallback if localStorage is empty) ---
const DEFAULT_HALLS: Hall[] = [
    {
        id: 'hall-1',
        name: 'القاعة الكبرى',
        capacity: 500,
        basePrice: 5000,
        hourlyRate: null,
        amenities: 'مجهزة بالكامل',
        location: 'الدور الأرضي',
        description: 'قاعة فاخرة مناسبة للأعراس والمناسبات الكبيرة',
        status: 'ACTIVE',
        bookingsCount: 12,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 10,
        defaultSacrifices: 5,
        defaultWaterCartons: 10,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 500,
        defaultSectionType: 'both' as const,
        mealPrices: { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
    },
    {
        id: 'hall-2',
        name: 'قاعة الحديقة',
        capacity: 300,
        basePrice: 3500,
        hourlyRate: null,
        amenities: 'إطلالة خارجية',
        location: 'الحديقة الخارجية',
        description: 'قاعة مفتوحة مع تشجير وإضاءة خافتة',
        status: 'ACTIVE',
        bookingsCount: 8,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 6,
        defaultSacrifices: 3,
        defaultWaterCartons: 8,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 300,
        defaultSectionType: 'both' as const,
        mealPrices: { dinner: 120, lunch: 80, breakfast: 40, snacks: 25 }
    },
    {
        id: 'hall-3',
        name: 'الجناح الملكي',
        capacity: 100,
        basePrice: 1500,
        hourlyRate: null,
        amenities: 'خدمة VIP',
        location: 'الدور الثاني',
        description: 'جناح خاص للمناسبات الصغيرة والاجتماعات',
        status: 'ACTIVE',
        bookingsCount: 5,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 2,
        defaultSacrifices: 0,
        defaultWaterCartons: 4,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 100,
        defaultSectionType: 'men' as const,
        mealPrices: { dinner: 200, lunch: 150, breakfast: 80, snacks: 50 }
    }
]

const EVENT_TYPES = [
    { id: 'WEDDING', label: 'زفاف' },
    { id: 'ENGAGEMENT', label: 'خطوبة' },
    { id: 'GRADUATION', label: 'تخرج' },
    { id: 'CONFERENCE', label: 'مؤتمر' },
    { id: 'OTHER', label: 'أخرى' }
]

const MEAL_TYPES = [
    { id: 'dinner', label: 'عشاء' },
    { id: 'lunch', label: 'غداء' },
    { id: 'breakfast', label: 'فطور' },
    { id: 'snacks', label: 'وجبات خفيفة' },
    { id: 'none', label: 'لا يوجد' }
]

const SERVICES_LIST = [
    { id: 'service-dj', name: 'نظام صوتي ودي جي', price: 800 },
    { id: 'service-lighting', name: 'إضاءة خاصة', price: 400 },
]

// --- Helper Functions for Date Sync ---

// Format a Date object to YYYY-MM-DD
const toGregorianString = (date: Date) => date.toISOString().split('T')[0]

// Get Hijri components from a Date object
const getHijriDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    })
    const parts = formatter.formatToParts(date)
    const day = parts.find(p => p.type === 'day')?.value || ''
    const month = parts.find(p => p.type === 'month')?.value || ''
    const year = parts.find(p => p.type === 'year')?.value || ''
    return { day, month, year }
}

// Approximate Gregorian from Hijri (Brute-force search around a pivot year)
// This is necessary because there is no built-in "Hijri to Gregorian" converter in JS Intl.
const findGregorianFromHijri = (hYear: string, hMonth: string, hDay: string) => {
    if (!hYear || !hMonth || !hDay) return null;

    const targetYear = parseInt(hYear);
    // Rough estimate: Hijri Year * 0.97 + 622
    const approxGregYear = Math.floor(targetYear * 0.97 + 622);

    // Search window: +/- 1 year around approx date
    const startDate = new Date(approxGregYear - 1, 0, 1);
    const endDate = new Date(approxGregYear + 1, 11, 31);

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
        const h = getHijriDate(d);
        if (h.year === hYear && h.month === hMonth && h.day === hDay) {
            return new Date(d);
        }
    }
    return null;
}

// Load halls from localStorage
const loadHallsFromStorage = (): Hall[] => {
    if (typeof window === 'undefined') return DEFAULT_HALLS
    try {
        const stored = localStorage.getItem(HALLS_STORAGE_KEY)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) {
        console.error('Error loading halls from localStorage:', e)
    }
    return DEFAULT_HALLS
}

export default function NewBookingPage() {
    const { isReadOnly } = useSubscription()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [loadingHalls, setLoadingHalls] = useState(true)

    // --- State ---

    // Customer
    const [customer, setCustomer] = useState({
        name: "",
        phone: "",
        idNumber: "",
        email: "" // Optional now, but good to keep
    })

    // Event Date
    const [dateType, setDateType] = useState<'gregorian' | 'hijri'>('gregorian')
    const [gregorianDate, setGregorianDate] = useState(toGregorianString(new Date()))
    const [hijriDate, setHijriDate] = useState({ day: '', month: '', year: '' })

    // Event Time
    const [startTime, setStartTime] = useState("16:00")
    const [endTime, setEndTime] = useState("23:00")
    const [eventType, setEventType] = useState("WEDDING")

    // Hall & Services
    const [halls, setHalls] = useState<Hall[]>([])
    const [selectedHallId, setSelectedHallId] = useState('')
    const [sectionType, setSectionType] = useState('both') // men, women, both
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [mealType, setMealType] = useState(MEAL_TYPES[0].id)
    const [guestCount, setGuestCount] = useState<number>(0)

    // New Fields - These will be set from Hall Config and are READ ONLY
    const [coffeeServers, setCoffeeServers] = useState<number>(0)
    const [sacrifices, setSacrifices] = useState<number>(0)
    const [waterCartons, setWaterCartons] = useState<number>(0)

    // Financial
    const [discountPercent, setDiscountPercent] = useState<string>('')
    const [downPayment, setDownPayment] = useState<string>('')

    // --- Effects & Logic ---

    // Load Halls from API (not localStorage mock data)
    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const res = await fetch('/api/halls')
                if (res.ok) {
                    const apiHalls = await res.json()
                    // Map API response to Hall type, adding default values for missing fields
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const mappedHalls: Hall[] = apiHalls.map((h: Record<string, any>) => ({
                        id: h.id,
                        name: h.name,
                        capacity: h.capacity,
                        basePrice: h.basePrice || h.price,
                        hourlyRate: h.hourlyRate,
                        amenities: h.amenities,
                        location: h.location,
                        description: h.description,
                        status: h.status || 'ACTIVE',
                        bookingsCount: h.bookingsCount || 0,
                        createdAt: h.createdAt,
                        // Use defaults from localStorage if available, otherwise fallback
                        defaultCoffeeServers: h.defaultCoffeeServers || 0,
                        defaultSacrifices: h.defaultSacrifices || 0,
                        defaultWaterCartons: h.defaultWaterCartons || 0,
                        coffeeServerPrice: h.coffeeServerPrice !== undefined && h.coffeeServerPrice !== null ? h.coffeeServerPrice : 100,
                        sacrificePrice: h.sacrificePrice !== undefined && h.sacrificePrice !== null ? h.sacrificePrice : 1500,
                        waterCartonPrice: h.waterCartonPrice !== undefined && h.waterCartonPrice !== null ? h.waterCartonPrice : 50,
                        extraSectionPrice: h.extraSectionPrice !== undefined && h.extraSectionPrice !== null ? h.extraSectionPrice : 0,
                        defaultGuestCount: h.defaultGuestCount || h.capacity,
                        defaultSectionType: h.defaultSectionType || 'both',
                        mealPrices: h.mealPrices || { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
                    }))
                    const activeHalls = mappedHalls.filter(h => h.status === 'ACTIVE')
                    setHalls(activeHalls)
                    if (activeHalls.length > 0) {
                        setSelectedHallId(activeHalls[0].id)
                    }
                } else {
                    // Fallback to localStorage if API fails
                    const loaded = loadHallsFromStorage()
                    setHalls(loaded.filter(h => h.status === 'ACTIVE'))
                    if (loaded.length > 0) {
                        setSelectedHallId(loaded[0].id)
                    }
                }
            } catch (error) {
                console.error('Error fetching halls:', error)
                // Fallback to localStorage
                const loaded = loadHallsFromStorage()
                setHalls(loaded.filter(h => h.status === 'ACTIVE'))
                if (loaded.length > 0) {
                    setSelectedHallId(loaded[0].id)
                }
            } finally {
                setLoadingHalls(false)
            }
        }
        fetchHalls()
    }, [])

    const selectedHall = useMemo(() => halls.find(h => h.id === selectedHallId) || (halls[0] || null), [halls, selectedHallId])

    // Update defaults when hall selection changes
    useEffect(() => {
        if (selectedHall) {
            // Set guest count from hall config (or capacity as fallback)
            setGuestCount(selectedHall.defaultGuestCount || selectedHall.capacity || 0)
            // Set section type from hall config (READ ONLY)
            setSectionType(selectedHall.defaultSectionType || 'both')
            // Set coffee servers, sacrifices, and water cartons from hall config (READ ONLY)
            setCoffeeServers(selectedHall.defaultCoffeeServers || 0)
            setSacrifices(selectedHall.defaultSacrifices || 0)
            setWaterCartons(selectedHall.defaultWaterCartons || 0)
        }
    }, [selectedHallId, selectedHall])

    // Initialize Hijri date on mount based on default Gregorian
    useEffect(() => {
        const today = new Date()
        setGregorianDate(toGregorianString(today))
        const h = getHijriDate(today)
        setHijriDate(h)
    }, [])

    const handleGregorianChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setGregorianDate(val)
        if (val) {
            const h = getHijriDate(new Date(val))
            setHijriDate(h)
        }
    }

    const handleHijriChange = (field: 'day' | 'month' | 'year', value: string) => {
        const newHijri = { ...hijriDate, [field]: value }
        setHijriDate(newHijri)

        // Try to sync to Gregorian if we have a full date
        if (newHijri.day && newHijri.month && newHijri.year) {
            const gDate = findGregorianFromHijri(newHijri.year, newHijri.month, newHijri.day)
            if (gDate) {
                setGregorianDate(toGregorianString(gDate))
            }
        }
    }

    const toggleService = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        )
    }

    // Helper: Calculate estimated total for a hall based on its defaults
    const getHallEstimatedTotal = (hall: Hall) => {
        const base = hall.basePrice || 0
        const sectionCharge = hall.defaultSectionType === 'both' ? (hall.extraSectionPrice || 1000) : 0
        const coffeeCharge = (hall.defaultCoffeeServers || 0) * (hall.coffeeServerPrice !== undefined ? hall.coffeeServerPrice : 100)
        const sacrificeCharge = (hall.defaultSacrifices || 0) * (hall.sacrificePrice !== undefined ? hall.sacrificePrice : 1500)
        // Assuming dinner as default meal for estimation
        const mealCharge = (hall.mealPrices?.dinner || 150) * (hall.defaultGuestCount || hall.capacity || 0)
        return base + sectionCharge + coffeeCharge + sacrificeCharge + mealCharge
    }

    // Calculations
    const basePrice = selectedHall?.basePrice || 0
    const servicesPrice = selectedServices.reduce((sum, id) => {
        const s = SERVICES_LIST.find(srv => srv.id === id)
        return sum + (s?.price || 0)
    }, 0)

    // Section Logic: Both sections cost more (use hall config)
    const sectionSurcharge = sectionType === 'both' ? (selectedHall?.extraSectionPrice || 1000) : 0

    // Meal Calculation - Use prices from Hall Config
    const getMealPrice = () => {
        if (!selectedHall || mealType === 'none') return 0
        const prices = selectedHall.mealPrices || { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
        switch (mealType) {
            case 'dinner': return prices.dinner || 0
            case 'lunch': return prices.lunch || 0
            case 'breakfast': return prices.breakfast || 0
            case 'snacks': return prices.snacks || 0
            default: return 0
        }
    }
    const mealPricePerPerson = getMealPrice()
    const mealTotalPrice = mealPricePerPerson * guestCount

    // Extra Services Calculation - Use prices from Hall Config
    const coffeeServersPrice = coffeeServers * (selectedHall?.coffeeServerPrice !== undefined ? selectedHall.coffeeServerPrice : 100)
    const sacrificesPrice = sacrifices * (selectedHall?.sacrificePrice !== undefined ? selectedHall.sacrificePrice : 1500)
    const waterCartonsPrice = waterCartons * (selectedHall?.waterCartonPrice !== undefined ? selectedHall.waterCartonPrice : 50)

    // Internal Service Revenue (for Qoyod accounting - NOT shown to customer)
    const serviceRevenue = coffeeServersPrice + sacrificesPrice + waterCartonsPrice
    const servicesBreakdown = JSON.stringify({
        coffee: coffeeServersPrice,
        sacrifice: sacrificesPrice,
        water: waterCartonsPrice
    })

    const subTotal = basePrice + servicesPrice + sectionSurcharge + mealTotalPrice + coffeeServersPrice + sacrificesPrice + waterCartonsPrice
    // Use basePrice for discount and remaining calculations (as per user request)
    const discountAmount = Math.round(basePrice * ((Number(discountPercent) || 0) / 100))
    const afterDiscount = basePrice - discountAmount
    // VAT is INCLUDED in the price (not added on top). Extract VAT from inclusive price.
    const vatAmount = Math.round(afterDiscount / 1.15 * 0.15) // VAT already included
    const totalAmount = afterDiscount // Total stays the same (VAT inclusive)
    const remainingAmount = totalAmount - (Number(downPayment) || 0)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isReadOnly) {
            alert("عفواً، لا يمكن إنشاء حجوزات جديدة في وضع القراءة فقط. يرجى تجديد الاشتراك.")
            return
        }
        setLoading(true)
        try {
            await bookingService.createBooking({
                customerName: customer.name,
                customerPhone: customer.phone,
                customerIdNumber: customer.idNumber,
                customerEmail: customer.email,
                date: gregorianDate,
                startTime,
                endTime,
                hallId: selectedHallId,
                eventType: 'WEDDING', // Default event type
                status: "PENDING",
                totalAmount: basePrice, // Original price before discount
                discountAmount: discountAmount,
                vatAmount: vatAmount, // VAT 15%
                downPayment: Number(downPayment) || 0,
                guestCount,
                sectionType,
                mealType,
                services: selectedServices,
                coffeeServers,
                sacrifices,
                waterCartons,
                serviceRevenue,
                servicesBreakdown,
            })
            router.push("/dashboard/bookings")
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : 'خطأ غير معروف'
            console.error("Failed to create booking", errMsg)
            alert("فشل في إنشاء الحجز: " + errMsg)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto pb-24">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/dashboard/bookings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--primary-700)]">حجز جديد</h1>
                    <p className="text-[var(--text-secondary)]">إدخال بيانات الحجز الجديد للعميل</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* --- RIGHT COLUMN (Main Form) --- */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. Customer Details */}
                    <Card className="border-t-4 border-t-[var(--primary-500)] shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="bg-[var(--primary-100)] p-1 rounded">👤</span>
                                بيانات العميل
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">رقم الجوال *</Label>
                                <Input
                                    id="phone"
                                    placeholder="05xxxxxxxx"
                                    value={customer.phone}
                                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                                    required
                                    className="text-left"
                                    dir="ltr"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-1">
                                <Label htmlFor="idNumber">رقم الهوية / السجل *</Label>
                                <Input
                                    id="idNumber"
                                    placeholder="10xxxxxxxx"
                                    value={customer.idNumber}
                                    onChange={e => setCustomer({ ...customer, idNumber: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label htmlFor="name">اسم العميل *</Label>
                                <Input
                                    id="name"
                                    placeholder="الاسم الثلاثي"
                                    value={customer.name}
                                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                                    required
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Hall & Event Details */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="bg-purple-100 p-1 rounded">🏰</span>
                                تفاصيل القاعة والمناسبة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Hall Selection */}
                            <div className="space-y-4">
                                <div>
                                    <Label className="mb-2 block">القاعة *</Label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {loadingHalls ? (
                                            <div className="col-span-3 text-center py-8 text-slate-500">جاري تحميل القاعات...</div>
                                        ) : halls.map(hall => (
                                            <div
                                                key={hall.id}
                                                onClick={() => setSelectedHallId(hall.id)}
                                                className={`cursor-pointer rounded-lg border p-4 transition-all hover:bg-slate-50
                                                    ${selectedHallId === hall.id
                                                        ? 'border-[var(--primary-500)] bg-[var(--primary-50)] ring-2 ring-[var(--primary-200)]'
                                                        : 'border-slate-200'}`}
                                            >
                                                <div className="font-semibold">{hall.name}</div>
                                                <div className="text-sm text-slate-500 mt-1">السعة: {hall.capacity} شخص</div>
                                                <div className="text-xs text-slate-500 mt-1">
                                                    القسم: {hall.defaultSectionType === 'men' ? 'رجال' : hall.defaultSectionType === 'women' ? 'نساء' : 'قسمين'}
                                                </div>
                                                <div className="text-sm font-medium text-[var(--primary-700)] mt-2">{hall.basePrice.toLocaleString()} ريال</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>نوع المناسبة *</Label>
                                    <select
                                        className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                        value={eventType}
                                        onChange={e => setEventType(e.target.value)}
                                    >
                                        {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Date Selection */}
                            <div className="space-y-4">
                                <Label>تاريخ المناسبة *</Label>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">

                                    {/* Gregorian */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">ميلادي</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-white h-10 px-3",
                                                        !gregorianDate && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {gregorianDate ? new Date(gregorianDate).toLocaleDateString('en-GB') : <span>اختر التاريخ</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="gregorian"
                                                    selected={gregorianDate ? new Date(gregorianDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            const val = toGregorianString(date);
                                                            setGregorianDate(val);
                                                            const h = getHijriDate(date);
                                                            setHijriDate(h);
                                                        }
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    {/* Hijri */}
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-500">هجري</Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal bg-white h-10 px-3",
                                                        (!hijriDate.day) && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {hijriDate.day && hijriDate.month && hijriDate.year
                                                        ? `${hijriDate.day} / ${hijriDate.month} / ${hijriDate.year}`
                                                        : <span>اختر التاريخ الهجري</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                {/* Hijri Calendar acts as driver for date selection too */}
                                                <Calendar
                                                    mode="hijri"
                                                    selected={gregorianDate ? new Date(gregorianDate) : undefined}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            // When selecting from Hijri calendar, 'date' is the JS Date obj representing that day
                                                            // So we update Gregorian normally and Hijri parts from it
                                                            const val = toGregorianString(date);
                                                            setGregorianDate(val);
                                                            const h = getHijriDate(date);
                                                            setHijriDate(h);
                                                        }
                                                    }}
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                        </CardContent>
                    </Card>

                    {/* Services & Meal section removed from display - calculations still work in background */}
                </div>

                {/* --- LEFT COLUMN (Summary & Payment) --- */}
                <div className="space-y-6">
                    <Card className="sticky top-6 border-[var(--primary-200)] bg-[var(--primary-50)/30]">
                        <CardHeader>
                            <CardTitle className="text-lg">ملخص التكاليف</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Price Summary */}
                            <div className="flex justify-between font-semibold text-base pb-3 border-b border-slate-200">
                                <span>السعر</span>
                                <span>{basePrice.toLocaleString()} ر.س</span>
                            </div>

                            {/* Discount & Down Payment - Side by Side */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">الخصم (%)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min="0" max="100"
                                            value={discountPercent}
                                            onChange={e => setDiscountPercent(e.target.value)}
                                            className="pl-8"
                                            placeholder="0"
                                        />
                                        <span className="absolute left-3 top-2.5 text-slate-400">%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">العربون (ر.س)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={downPayment}
                                        onChange={e => setDownPayment(e.target.value)}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {/* Summary Display */}
                            <div className="space-y-1 py-2 border-t border-dashed border-slate-300 text-sm">
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-red-600">
                                        <span>الخصم ({discountPercent}%)</span>
                                        <span>-{discountAmount.toLocaleString()} ر.س</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-slate-600">
                                    <span>ض.ق.م (15%)</span>
                                    <span>{vatAmount.toLocaleString()} ر.س</span>
                                </div>
                                {(Number(downPayment) || 0) > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>العربون</span>
                                        <span>-{(Number(downPayment) || 0).toLocaleString()} ر.س</span>
                                    </div>
                                )}
                            </div>

                            {/* Total Final */}
                            <div className="bg-[var(--primary-700)] text-white p-4 rounded-lg space-y-1">
                                <div className="flex justify-between text-xl font-bold">
                                    <span>المتبقي</span>
                                    <span>{remainingAmount.toLocaleString()} ر.س</span>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className={`w-full h-12 text-lg font-bold bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                disabled={loading || isReadOnly}
                                title={isReadOnly ? "غير متاح في وضع القراءة فقط" : ""}
                            >
                                {loading ? "جاري الحفظ..." : isReadOnly ? "غير متاح (اشتراك منتهي)" : "تأكيد الحجز"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    )
}
