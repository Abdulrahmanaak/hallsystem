"use client"

import React, { useState, useEffect } from 'react'
import type { PublicHall } from './page'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { CalendarIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

const EVENT_TYPES = [
    { id: 'WEDDING', label: 'زفاف' },
    { id: 'ENGAGEMENT', label: 'خطوبة' },
    { id: 'GRADUATION', label: 'تخرج' },
    { id: 'CONFERENCE', label: 'مؤتمر' },
    { id: 'OTHER', label: 'أخرى' }
]

// --- Helper Functions for Date Sync (from internal booking page) ---
const toGregorianString = (date: Date) => date.toISOString().split('T')[0]
const getHijriDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric'
    })
    const parts = formatter.formatToParts(date)
    return {
        day: parts.find(p => p.type === 'day')?.value || '',
        month: parts.find(p => p.type === 'month')?.value || '',
        year: parts.find(p => p.type === 'year')?.value || ''
    }
}
const findGregorianFromHijri = (hYear: string, hMonth: string, hDay: string) => {
    if (!hYear || !hMonth || !hDay) return null;
    const targetYear = parseInt(hYear);
    const approxGregYear = Math.floor(targetYear * 0.97 + 622);
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


interface PublicBookingFormProps {
    halls: PublicHall[]
    companyName: string
}

export function PublicBookingForm({ halls, companyName }: PublicBookingFormProps) {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // Form State
    const [selectedHallId, setSelectedHallId] = useState<string>(halls[0]?.id || '')
    const [customerName, setCustomerName] = useState('')
    const [customerPhone, setCustomerPhone] = useState('')
    const [customerIdNumber, setCustomerIdNumber] = useState('')
    const [eventType, setEventType] = useState('WEDDING')

    // Date State
    const [gregorianDate, setGregorianDate] = useState('')
    const [hijriDate, setHijriDate] = useState({ day: '', month: '', year: '' })

    // Initialize Dates correctly on mount (Client Side only)
    useEffect(() => {
        const today = new Date()
        setGregorianDate(toGregorianString(today))
        setHijriDate(getHijriDate(today))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        setSuccess(false)

        try {
            const res = await fetch('/api/public/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    customerPhone,
                    customerIdNumber,
                    date: gregorianDate,
                    eventType,
                    hallId: selectedHallId
                    // guestCount, sectionType, etc. are handled by backend defaults
                })
            })

            const data = await res.json()

            if (res.ok && data.success) {
                setSuccess(true)
            } else {
                setErrorMsg(data.error || 'حدث خطأ مجهول')
            }
        } catch (err) {
            console.error(err)
            setErrorMsg('فشل الاتصال بالخادم، يرجى المحاولة لاحقاً')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        const bookedHall = halls.find(h => h.id === selectedHallId)
        return (
            <div className="text-center py-12 space-y-4">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="text-green-500 w-24 h-24" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">تم إرسال طلب الحجز بنجاح!</h2>
                <p className="text-slate-600 max-w-md mx-auto">
                    شكراً لك، تم استقبال طلب حجز {bookedHall?.name ? `قاعة "${bookedHall.name}"` : 'القاعة'}. سنتواصل معك قريباً على رقم الجوال المرفق لتأكيد التفاصيل وإتمام الدفع.
                </p>
                <div className="pt-8">
                    <Button onClick={() => window.location.reload()} variant="outline">
                        تقديم طلب حجز جديد
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {errorMsg && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-2 text-sm border border-red-200">
                    <span className="font-bold shrink-0">تنبيه:</span>
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Hall Selection */}
            {halls.length > 1 && (
                <div className="space-y-4">
                    <h4 className="font-semibold text-slate-800 border-b pb-2">القاعة المطلوبة</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {halls.map((hall) => (
                            <div
                                key={hall.id}
                                onClick={() => setSelectedHallId(hall.id)}
                                className={cn(
                                    "p-4 rounded-xl cursor-pointer border-2 transition-all flex flex-col gap-1",
                                    selectedHallId === hall.id
                                        ? "border-[var(--primary-600)] bg-[var(--primary-50)] shadow-md"
                                        : "border-slate-200 bg-white hover:border-[var(--primary-300)] hover:bg-slate-50"
                                )}
                            >
                                <h5 className="font-bold text-slate-900">{hall.name}</h5>
                                <div className="text-xs text-slate-500 flex justify-between">
                                    <span>السعة: {hall.capacity}</span>
                                    <span className="font-medium text-[var(--primary-700)]">{hall.basePrice} ر.س</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-semibold text-slate-800 border-b pb-2">البيانات الشخصية</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">الاسم الثلاثي *</Label>
                        <Input
                            id="name"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            required
                            placeholder="محمد عبدالله ..."
                            className="bg-slate-50 focus:bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">رقم الجوال *</Label>
                        <Input
                            id="phone"
                            value={customerPhone}
                            onChange={e => setCustomerPhone(e.target.value)}
                            required
                            placeholder="05xxxxxxxx"
                            dir="ltr"
                            className="text-left bg-slate-50 focus:bg-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="idNumber">رقم الهوية / الإقامة *</Label>
                        <Input
                            id="idNumber"
                            value={customerIdNumber}
                            onChange={e => setCustomerIdNumber(e.target.value)}
                            required
                            placeholder="10xxxxxxxx"
                            className="bg-slate-50 focus:bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h4 className="font-semibold text-slate-800 border-b pb-2">تفاصيل المناسبة</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                        <Label>نوع المناسبة *</Label>
                        <select
                            value={eventType}
                            onChange={e => setEventType(e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-slate-50 text-sm focus:bg-white"
                        >
                            {EVENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                        </select>
                    </div>

                    <div className="space-y-3 md:col-span-2">
                        <Label className="block">تاريخ المناسبة المطلوب *</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">

                            {/* Gregorian Date */}
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500">ميلادي</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-white",
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
                                                    setHijriDate(getHijriDate(date));
                                                }
                                            }}
                                            disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Hijri Date */}
                            <div className="space-y-2">
                                <Label className="text-xs text-slate-500">هجري</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-white",
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
                                        <Calendar
                                            mode="hijri"
                                            selected={gregorianDate ? new Date(gregorianDate) : undefined}
                                            onSelect={(date) => {
                                                if (date) {
                                                    const val = toGregorianString(date);
                                                    setGregorianDate(val);
                                                    setHijriDate(getHijriDate(date));
                                                }
                                            }}
                                            disabled={(date: Date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8">
                <Button
                    type="submit"
                    className="w-full h-12 text-lg font-bold bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white shadow-lg"
                    disabled={loading || !selectedHallId || !customerName || !customerPhone || !customerIdNumber || !gregorianDate}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            جاري الإرسال...
                        </>
                    ) : (
                        'إرسال طلب الحجز'
                    )}
                </Button>
                <p className="text-center text-xs text-slate-500 mt-4">
                    بالنقر على "إرسال طلب الحجز"، أنت توافق على شروط وأحكام {companyName}.
                </p>
            </div>
        </form>
    )
}
