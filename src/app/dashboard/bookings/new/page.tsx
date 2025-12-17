"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { bookingService } from "@/lib/services/booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { ArrowLeft, Save, Calendar as CalendarIcon, Check, Calculator } from "lucide-react"
import Link from "next/link"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// --- Constants & Types ---

const HALLS = [
    { id: 'hall-1', name: 'القاعة الكبرى', capacity: 500, price: 5000 },
    { id: 'hall-2', name: 'قاعة الحديقة', capacity: 300, price: 3500 },
    { id: 'hall-3', name: 'الجناح الملكي', capacity: 100, price: 1500 },
]

const EVENT_TYPES = [
    { id: 'WEDDING', label: 'زفاف' },
    { id: 'ENGAGEMENT', label: 'خطوبة' },
    { id: 'GRADUATION', label: 'تخرج' },
    { id: 'CONFERENCE', label: 'مؤتمر' },
    { id: 'OTHER', label: 'أخرى' }
]

const MEAL_TYPES = [
    { id: 'dinner', label: 'عشاء', price: 150 }, // Price per person
    { id: 'lunch', label: 'غداء', price: 100 },
    { id: 'breakfast', label: 'فطور', price: 50 },
    { id: 'snacks', label: 'وجبات خفيفة', price: 30 },
    { id: 'none', label: 'لا يوجد', price: 0 }
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

export default function NewBookingPage() {
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
    const [halls, setHalls] = useState<any[]>([])
    const [selectedHallId, setSelectedHallId] = useState('')
    const [sectionType, setSectionType] = useState('both') // men, women, both
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [mealType, setMealType] = useState(MEAL_TYPES[0].id)
    const [guestCount, setGuestCount] = useState<number>(0)

    // New Fields
    const [coffeeServers, setCoffeeServers] = useState<number>(0)
    const [sacrifices, setSacrifices] = useState<number>(0)

    // Financial
    const [discountPercent, setDiscountPercent] = useState(0)
    const [downPayment, setDownPayment] = useState(0)

    // --- Effects & Logic ---

    // Fetch Halls logic
    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const res = await fetch('/api/halls')
                if (!res.ok) throw new Error('Failed to fetch halls')
                const data = await res.json()
                setHalls(data)
                if (data.length > 0) {
                    setSelectedHallId(data[0].id)
                }
            } catch (err) {
                console.error("Error fetching halls:", err)
            } finally {
                setLoadingHalls(false)
            }
        }
        fetchHalls()
    }, [])

    const selectedHall = useMemo(() => halls.find(h => h.id === selectedHallId) || (halls[0] || { price: 0, name: '', capacity: 0 }), [halls, selectedHallId])

    // Update defaults when hall selection changes
    useEffect(() => {
        if (selectedHall) {
            const cap = selectedHall.capacity || 0
            setGuestCount(cap) // Default guest count to full capacity
            setCoffeeServers(Math.ceil(cap / 50)) // Logic: 1 server per 50 guests
            setSacrifices(Math.ceil(cap / 100)) // Logic: 1 sacrifice per 100 guests
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

    // Calculations
    const basePrice = selectedHall?.price || 0
    const servicesPrice = selectedServices.reduce((sum, id) => {
        const s = SERVICES_LIST.find(srv => srv.id === id)
        return sum + (s?.price || 0)
    }, 0)

    // Section Logic: Both sections cost more
    const sectionSurcharge = sectionType === 'both' ? 1000 : 0

    // Meal Calculation
    const selectedMeal = MEAL_TYPES.find(m => m.id === mealType)
    const mealPrice = (selectedMeal?.price || 0) * guestCount

    // Extra Services Calculation
    const coffeeServersPrice = coffeeServers * 100
    const sacrificesPrice = sacrifices * 1500

    const subTotal = basePrice + servicesPrice + sectionSurcharge + mealPrice + coffeeServersPrice + sacrificesPrice
    const discountAmount = Math.round(subTotal * (discountPercent / 100))
    const totalAmount = subTotal - discountAmount
    const remainingAmount = totalAmount - downPayment

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
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
                status: "TENTATIVE",
                totalAmount: totalAmount,
                guestCount,
                sectionType,
                mealType,
                services: selectedServices,
                coffeeServers, // Pass new fields
                sacrifices,
            })
            router.push("/dashboard/bookings")
        } catch (error) {
            console.error("Failed to create booking", error)
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
                                                <div className="text-sm font-medium text-[var(--primary-700)] mt-2">{hall.price.toLocaleString()} ريال</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>عدد الضيوف (للوجبات)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={guestCount}
                                            onChange={e => setGuestCount(Number(e.target.value))}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>الأقسام</Label>
                                        <div className="flex gap-2 p-1 bg-slate-100 rounded-md">
                                            {['men', 'women', 'both'].map(type => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setSectionType(type)}
                                                    className={`flex-1 py-1.5 text-sm rounded-md transition-all justify-center text-center
                                                        ${sectionType === type
                                                            ? 'bg-white shadow text-[var(--primary-700)] font-medium'
                                                            : 'text-slate-500 hover:text-slate-700'}`}
                                                >
                                                    {type === 'men' ? 'رجال' : type === 'women' ? 'نساء' : 'قسمين'}
                                                </button>
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

                    {/* 3. Services & Meal */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <span className="bg-orange-100 p-1 rounded">🍽️</span>
                                الخدمات والضيافة
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* SERVICES GRID */}
                            <div className="space-y-3">
                                <Label>الخدمات الإضافية</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {SERVICES_LIST.map(service => (
                                        <div
                                            key={service.id}
                                            onClick={() => toggleService(service.id)}
                                            className={`flex items-center space-x-3 space-x-reverse p-3 rounded-lg border cursor-pointer transition-colors
                                                ${selectedServices.includes(service.id)
                                                    ? 'bg-orange-50 border-orange-200'
                                                    : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center
                                                ${selectedServices.includes(service.id) ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                                                {selectedServices.includes(service.id) && <Check size={14} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{service.name}</div>
                                                <div className="text-xs text-slate-500">+{service.price} ريال</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* NEW FIELDS: Servers and Sacrifices */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>عدد عمال الضيافة (القهوجية)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={coffeeServers}
                                        onChange={e => setCoffeeServers(Number(e.target.value))}
                                    />
                                    <p className="text-xs text-slate-400">افتراضي: 1 لكل 50 ضيف (100 ريال/عامل)</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>عدد الذبائح</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={sacrifices}
                                        onChange={e => setSacrifices(Number(e.target.value))}
                                    />
                                    <p className="text-xs text-slate-400">افتراضي: 1 لكل 100 ضيف (1500 ريال/ذبيحة)</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>الوجبة</Label>
                                <select
                                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                                    value={mealType}
                                    onChange={e => setMealType(e.target.value)}
                                >
                                    {MEAL_TYPES.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.label} ({t.price > 0 ? `${t.price} ريال/شخص` : 'مجاني'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* --- LEFT COLUMN (Summary & Payment) --- */}
                <div className="space-y-6">
                    <Card className="sticky top-6 border-[var(--primary-200)] bg-[var(--primary-50)/30]">
                        <CardHeader>
                            <CardTitle className="text-lg">ملخص التكاليف</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Breakdown */}
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">القاعة ({selectedHall.name})</span>
                                    <span className="font-medium">{selectedHall.price.toLocaleString()}</span>
                                </div>
                                {sectionType === 'both' && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>رسوم قسمين</span>
                                        <span>+1,000</span>
                                    </div>
                                )}

                                {/* Individual Services Breakdown */}
                                {selectedServices.map(sid => {
                                    const s = SERVICES_LIST.find(srv => srv.id === sid)
                                    return s ? (
                                        <div key={sid} className="flex justify-between text-slate-600 text-xs">
                                            <span>{s.name}</span>
                                            <span>+{s.price}</span>
                                        </div>
                                    ) : null
                                })}

                                {/* Coffee Servers Breakdown */}
                                {coffeeServers > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>قهوجية ({coffeeServers})</span>
                                        <span>+{(coffeeServers * 100).toLocaleString()}</span>
                                    </div>
                                )}

                                {/* Sacrifices Breakdown */}
                                {sacrifices > 0 && (
                                    <div className="flex justify-between text-slate-600">
                                        <span>ذبائح ({sacrifices})</span>
                                        <span>+{(sacrifices * 1500).toLocaleString()}</span>
                                    </div>
                                )}

                                {mealPrice > 0 && (
                                    <div className="flex justify-between text-green-700 font-medium">
                                        <span>الوجبات ({guestCount} ضيف)</span>
                                        <span>+{mealPrice.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="pt-2 border-t border-dashed border-slate-300 flex justify-between font-semibold">
                                    <span>المجموع الفرعي</span>
                                    <span>{subTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Discount */}
                            <div className="space-y-2 pt-2">
                                <Label className="text-xs">الخصم (%)</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        min="0" max="100"
                                        value={discountPercent}
                                        onChange={e => setDiscountPercent(Number(e.target.value))}
                                        className="pl-8"
                                    />
                                    <span className="absolute left-3 top-2.5 text-slate-400">%</span>
                                </div>
                            </div>

                            {/* Down Payment */}
                            <div className="space-y-2">
                                <Label className="text-xs">العربون (ر.س)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={downPayment}
                                    onChange={e => setDownPayment(Number(e.target.value))}
                                />
                            </div>

                            {/* Total Final */}
                            <div className="bg-[var(--primary-700)] text-white p-4 rounded-lg mt-4 space-y-1">
                                <div className="flex justify-between text-sm opacity-90">
                                    <span>الإجمالي (بعد الخصم)</span>
                                    <span>{totalAmount.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex justify-between text-xl font-bold">
                                    <span>المتبقي</span>
                                    <span>{remainingAmount.toLocaleString()} ر.س</span>
                                </div>
                            </div>

                        </CardContent>
                        <CardFooter>
                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold bg-[var(--primary-600)] hover:bg-[var(--primary-700)]"
                                disabled={loading}
                            >
                                {loading ? "جاري الحفظ..." : "تأكيد الحجز"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </div>
    )
}
