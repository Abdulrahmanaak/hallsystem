"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Printer, AlertCircle } from "lucide-react"
import Link from "next/link"

// Contract Terms (Hardcoded from official contract)
const CONTRACT_TERMS = [
    "قيمة العقد غير قابلة للتجزئة، ويعتبر هذا العقد نهائيًا ولا يحق للطرف الثاني الحصول على أصل العقد إلا بعد دفع نصف قيمة العقد.",
    "في حال عدم سداد الدفعة الثانية من قيمة العقد في موعدها يُلغى الحجز ويلتزم الطرف الثاني بدفع كامل قيمة العقد ولا يحق له المطالبة بأي تعويض.",
    "يلتزم الطرف الثاني بعدم إدخال أي إضافات أو تجهيزات مخالفة لطبيعة القاعة أو تتعارض مع الشكل الأساسي للقاعة.",
    "يمنع منعًا باتًا إدخال الألعاب النارية أو المرخصة وغير المرخصة داخل القاعة، وكذلك منع إلقاء المخلفات أو العبث بمحتويات القاعة.",
    "يلتزم الطرف الثاني بالمحافظة على القاعة وتسليمها بحالتها الأصلية، ويتحمل أي تلفيات أو أضرار ناتجة عن سوء الاستخدام.",
    "يلتزم الطرف الثاني بالتقيد بوقت الدخول والخروج، وفي حال التأخير يتحمل غرامة مالية.",
    "في حال التأخير عن موعد الخروج يتم احتساب غرامة قدرها (5000) ريال.",
    "يمنع منعًا باتًا التنازل عن العقد أو تأجير القاعة لطرف ثالث.",
    "يحق للطرف الأول فسخ العقد في حال مخالفة أي بند من بنود هذا العقد دون أي التزام بالتعويض.",
    "يلتزم الطرف الثاني بدفع أي رسوم إضافية ناتجة عن خدمات إضافية يتم طلبها.",
    "يتحمل الطرف الثاني ضريبة القيمة المضافة المقررة على هذا العقد.",
    "يعتبر هذا العقد ملزمًا للطرفين بعد التوقيع عليه ويلتزم كل طرف بما فيه من بنود."
]

// Company Info (Hardcoded)
const COMPANY_INFO = {
    name: "شركة حفـاوة للأفراح والمناسبات",
    taxNumber: "310606567300003",
    address: "القصيم – رياض الخبراء",
    addressLine2: "طريق الملك عبدالعزيز – مقابل دوار الرس"
}

// Helper: Get Hijri date from Gregorian
const getHijriDate = (date: Date) => {
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
    })
    return formatter.format(date)
}

// Helper: Get Arabic day name
const getArabicDayName = (date: Date) => {
    const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
    return days[date.getDay()]
}

// Helper: Get next day name for "ليلة"
const getNextDayName = (date: Date) => {
    const days = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد']
    return days[date.getDay()]
}

interface BookingData {
    id: string
    bookingNumber: string
    customerName: string
    customerPhone: string
    customerIdNumber: string
    hallName: string
    eventDate: string
    date: string
    totalAmount: number
    downPayment: number
    discountAmount: number
    vatAmount: number
    finalAmount: number
    coffeeServers?: number
    sacrifices?: number
    waterCartons?: number
    guestCount?: number
    sectionType?: string
    status: string
}

export default function ContractPage() {
    const params = useParams()
    const router = useRouter()
    const bookingId = params.id as string

    const [booking, setBooking] = useState<BookingData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                const res = await fetch('/api/bookings')
                if (!res.ok) throw new Error('Failed to fetch bookings')
                const bookings = await res.json()
                const found = bookings.find((b: BookingData) => b.id === bookingId)
                if (!found) {
                    setError('الحجز غير موجود')
                } else {
                    setBooking(found)
                }
            } catch (err) {
                setError('حدث خطأ في تحميل البيانات')
            } finally {
                setLoading(false)
            }
        }
        fetchBooking()
    }, [bookingId])

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-lg text-slate-500">جاري تحميل العقد...</div>
            </div>
        )
    }

    if (error || !booking) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div className="text-lg text-red-600">{error || 'الحجز غير موجود'}</div>
                <Link href="/dashboard/bookings">
                    <Button variant="outline">العودة للحجوزات</Button>
                </Link>
            </div>
        )
    }

    // Check if fully paid (for now, check if status is CONFIRMED or finalAmount - downPayment <= 0)
    const remainingAmount = booking.finalAmount - booking.downPayment
    const isFullyPaid = remainingAmount <= 0 || booking.status === 'COMPLETED'

    // If not fully paid, show warning but still allow viewing (as per common business practice)
    // The print button can be disabled if needed

    const eventDate = new Date(booking.eventDate)
    const hijriDate = getHijriDate(eventDate)
    const gregorianDate = eventDate.toLocaleDateString('en-GB')
    const dayName = getArabicDayName(eventDate)
    const nextDayName = getNextDayName(eventDate)
    const todayHijri = getHijriDate(new Date())
    const todayGregorian = new Date().toLocaleDateString('en-GB')

    // Build services list
    const servicesList = []
    if (booking.coffeeServers && booking.coffeeServers > 0) {
        servicesList.push(`صبابين ${booking.coffeeServers}`)
    }
    if (booking.waterCartons && booking.waterCartons > 0) {
        servicesList.push(`كرتون ماء ${booking.waterCartons}`)
    }
    if (booking.sacrifices && booking.sacrifices > 0) {
        servicesList.push(`ذبائح ${booking.sacrifices}`)
    }

    // Calculate amounts (match view details modal)
    const subtotal = booking.totalAmount
    const discount = booking.discountAmount || 0
    const afterDiscount = subtotal - discount
    // VAT is INCLUDED in price, extract it (same as view details)
    const vat = booking.vatAmount || Math.round(afterDiscount / 1.15 * 0.15)
    const total = afterDiscount // VAT inclusive, not added on top
    const downPayment = booking.downPayment || 0
    const remaining = total - downPayment

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .contract-page, .contract-page * {
                        visibility: visible;
                    }
                    .contract-page {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 10px;
                        font-size: 11px;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                }
            `}</style>

            {/* Navigation Bar - Hidden on Print */}
            <div className="no-print p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/bookings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">عقد تأجير قاعة</h1>
                </div>
                <div className="flex items-center gap-2">
                    {!isFullyPaid && (
                        <span className="text-amber-600 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            لم يتم السداد بالكامل
                        </span>
                    )}
                    <Button onClick={handlePrint} className="gap-2">
                        <Printer className="h-4 w-4" />
                        طباعة
                    </Button>
                </div>
            </div>

            {/* Contract Content */}
            <div className="contract-page max-w-4xl mx-auto p-4 bg-white text-[12px] leading-tight" dir="rtl">

                {/* Header */}
                <div className="border-2 border-slate-800 mb-3">
                    <div className="flex items-start justify-between p-2 border-b border-slate-300">
                        {/* Logo Placeholder */}
                        <div className="w-16 h-16 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                            الشعار
                        </div>

                        {/* Title */}
                        <div className="text-center flex-1">
                            <h1 className="text-lg font-bold text-blue-800 mb-1">{COMPANY_INFO.name}</h1>
                            <h2 className="text-base font-bold border-2 border-blue-800 inline-block px-4 py-1 bg-blue-50">
                                عقد تأجير قاعة
                            </h2>
                        </div>

                        {/* Contract Number */}
                        <div className="text-left text-[11px] space-y-0.5">
                            <div>رقم العقد: <span className="font-bold">{booking.bookingNumber.split('-').pop()}</span></div>
                            <div>الرقم الضريبي: {COMPANY_INFO.taxNumber}</div>
                        </div>
                    </div>

                    {/* Agreement Date */}
                    <div className="p-2 text-center bg-slate-50 border-b border-slate-300 text-[11px]">
                        <p>بعون الله تعالى في يوم <span className="font-bold">{todayHijri}</span> هـ الموافق <span className="font-bold">{todayGregorian}</span> م تم الاتفاق بين كلٍ من:</p>
                    </div>

                    {/* Parties */}
                    <div className="grid grid-cols-2 divide-x divide-x-reverse divide-slate-300">
                        <div className="p-2">
                            <p className="font-bold text-blue-800 mb-1">الطرف الأول:</p>
                            <p>{COMPANY_INFO.name}</p>
                        </div>
                        <div className="p-2">
                            <p className="font-bold text-blue-800 mb-1">الطرف الثاني:</p>
                            <p>{booking.customerName}</p>
                            <p className="text-[10px] text-slate-600">رقم الهوية: {booking.customerIdNumber} | الجوال: {booking.customerPhone}</p>
                        </div>
                    </div>

                    {/* Rental Details */}
                    <div className="p-2 border-t border-slate-300 bg-slate-50 text-[11px]">
                        <p>على أن يقوم الطرف الأول بتأجير: <span className="font-bold text-blue-800">{booking.hallName}</span> وذلك يوم <span className="font-bold">{dayName}</span> ليلة <span className="font-bold">{nextDayName}</span> تاريخ المناسبة: <span className="font-bold">{hijriDate}</span> هـ الموافق <span className="font-bold">{gregorianDate}</span> م</p>
                    </div>
                </div>

                {/* Terms Section */}
                <div className="border-2 border-slate-800 mb-3">
                    <div className="bg-blue-800 text-white py-1 px-2 text-center font-bold text-[11px]">
                        الشروط والأحكام
                    </div>
                    <div className="p-2">
                        <p className="mb-1 text-[10px]">وبذلك أقر الطرفان وهما بكامل الأهلية المعتبرة شرعًا ونظامًا على الشروط التالية:</p>
                        <ol className="list-decimal list-inside space-y-0.5 text-[10px] leading-snug">
                            {CONTRACT_TERMS.map((term, index) => (
                                <li key={index}>{term}</li>
                            ))}
                        </ol>
                    </div>
                </div>

                {/* Services & Financial Summary */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    {/* Services Box */}
                    <div className="border-2 border-slate-800">
                        <div className="bg-blue-800 text-white py-1 px-2 text-center font-bold text-[11px]">
                            ملاحظات
                        </div>
                        <div className="p-2">
                            <p className="font-bold mb-1 text-[11px]">يشمل مبلغ العقد:</p>
                            {servicesList.length > 0 ? (
                                <p className="text-[11px]">{servicesList.join('، ')}</p>
                            ) : (
                                <p className="text-[11px] text-slate-500">لا توجد خدمات إضافية</p>
                            )}
                        </div>
                    </div>

                    {/* Financial Table */}
                    <div className="border-2 border-slate-800">
                        <div className="bg-blue-800 text-white py-1 px-2 text-center font-bold text-[11px]">
                            الملخص المالي
                        </div>
                        <div className="p-2">
                            <table className="w-full text-[10px]">
                                <tbody>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1">المبلغ:</td>
                                        <td className="py-1 text-left font-bold">{subtotal.toLocaleString()} ريال</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1">الخصم:</td>
                                        <td className="py-1 text-left text-red-600">-{discount.toLocaleString()} ريال</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1">ض.ق.م (15%):</td>
                                        <td className="py-1 text-left">{vat.toLocaleString()} ريال</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1">العربون:</td>
                                        <td className="py-1 text-left text-green-600">{downPayment.toLocaleString()} ريال</td>
                                    </tr>
                                    <tr className="bg-blue-50">
                                        <td className="py-1 font-bold">المتبقي:</td>
                                        <td className="py-1 text-left font-bold text-blue-800">{remaining.toLocaleString()} ريال</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="border-2 border-slate-800 p-2">
                        <p className="font-bold text-blue-800 mb-2 text-[11px]">الطرف الأول</p>
                        <p className="text-[10px] mb-1">الاسم: ...........................</p>
                        <p className="text-[10px]">التوقيع: ...........................</p>
                    </div>
                    <div className="border-2 border-slate-800 p-2">
                        <p className="font-bold text-blue-800 mb-2 text-[11px]">الطرف الثاني</p>
                        <p className="text-[10px] mb-1">الاسم: {booking.customerName}</p>
                        <p className="text-[10px]">التوقيع: ...........................</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-blue-800 pt-2 text-center text-[10px] text-slate-600">
                    <p className="font-bold">{COMPANY_INFO.address} | {COMPANY_INFO.addressLine2}</p>
                </div>
            </div>
        </>
    )
}

