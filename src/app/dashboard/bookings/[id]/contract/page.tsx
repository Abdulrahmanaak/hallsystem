"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Printer, AlertCircle } from "lucide-react"
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

// Company settings will be fetched from API
interface CompanySettings {
    companyNameAr: string
    companyLogo: string | null
    vatRegNo: string | null
    companyAddress: string | null
    companyAddressLine2: string | null
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

// Helper: Convert number to Arabic words
const numberToArabicWords = (num: number): string => {
    const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر']
    const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون']
    const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة']

    if (num === 0) return 'صفر'
    if (num < 0) return 'سالب ' + numberToArabicWords(-num)

    let result = ''

    // Millions
    if (num >= 1000000) {
        const millions = Math.floor(num / 1000000)
        if (millions === 1) result += 'مليون '
        else if (millions === 2) result += 'مليونان '
        else if (millions <= 10) result += ones[millions] + ' ملايين '
        else result += numberToArabicWords(millions) + ' مليون '
        num %= 1000000
    }

    // Thousands
    if (num >= 1000) {
        const thousands = Math.floor(num / 1000)
        if (thousands === 1) result += 'ألف '
        else if (thousands === 2) result += 'ألفان '
        else if (thousands >= 3 && thousands <= 10) result += ones[thousands] + ' آلاف '
        else if (thousands > 10) result += numberToArabicWords(thousands) + ' ألف '
        num %= 1000
    }

    // Hundreds
    if (num >= 100) {
        result += hundreds[Math.floor(num / 100)] + ' '
        num %= 100
    }

    // Tens and ones
    if (num > 0) {
        if (result !== '') result += 'و'
        if (num < 20) {
            result += ones[num]
        } else {
            const ten = Math.floor(num / 10)
            const one = num % 10
            if (one > 0) {
                result += ones[one] + ' و' + tens[ten]
            } else {
                result += tens[ten]
            }
        }
    }

    return result.trim()
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
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
    const [totalPaid, setTotalPaid] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
        companyNameAr: 'نظام إدارة القاعات',
        companyLogo: null,
        vatRegNo: null,
        companyAddress: null,
        companyAddressLine2: null
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch bookings
                const bookingsRes = await fetch('/api/bookings')
                if (!bookingsRes.ok) throw new Error('Failed to fetch bookings')
                const bookings = await bookingsRes.json()

                // Fetch settings with fallback
                let settings = DEFAULT_COMPANY_SETTINGS
                try {
                    const settingsRes = await fetch('/api/settings')
                    if (settingsRes.ok) {
                        settings = await settingsRes.json()
                        // Update cache if successful
                        localStorage.setItem('settings_cache', JSON.stringify(settings))
                    } else {
                        throw new Error('Settings API failed')
                    }
                } catch (error) {
                    console.warn('Failed to fetch settings, using fallback/cache')
                    const cached = localStorage.getItem('settings_cache')
                    if (cached) {
                        settings = JSON.parse(cached)
                    }
                }

                const found = bookings.find((b: BookingData) => b.id === bookingId)
                if (!found) {
                    setError('الحجز غير موجود')
                } else {
                    setBooking(found)
                    setCompanySettings(settings)

                    // Fetch payments for this booking to calculate paid amount
                    try {
                        const paymentsRes = await fetch('/api/payments')
                        if (paymentsRes.ok) {
                            const allPayments = await paymentsRes.json()
                            const bookingPayments = allPayments.filter((p: { bookingId: string }) => p.bookingId === bookingId)
                            const paidSum = bookingPayments.reduce((sum: number, p: { amount: number | string }) => sum + Number(p.amount), 0)
                            setTotalPaid(paidSum)
                        }
                    } catch (e) {
                        console.warn('Could not fetch payments')
                    }
                }
            } catch (err) {
                console.error(err)
                setError('حدث خطأ في تحميل البيانات')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
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

    if (error || !booking || !companySettings) {
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

    // Check if fully paid based on actual payments
    const remainingAmount = booking.finalAmount - totalPaid
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
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">عقد تأجير قاعة</h1>
                </div>
                <div className="flex items-center gap-2">
                    {!isFullyPaid && (
                        <span className="text-amber-600 text-sm flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            لم يتم السداد بالكامل - المتبقي: {remainingAmount.toLocaleString()} ر.س
                        </span>
                    )}
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!isFullyPaid}
                        title={!isFullyPaid ? 'لا يمكن طباعة العقد قبل اكتمال السداد' : 'طباعة العقد'}
                    >
                        <Printer className="h-4 w-4 text-white" />
                        طباعة
                    </Button>
                </div>
            </div>

            {/* Contract Content */}
            <div className="contract-page max-w-4xl mx-auto p-4 bg-white text-[12px] leading-tight" dir="rtl">

                {/* Header */}
                <div className="border-2 border-slate-800 mb-3">
                    <div className="flex items-center justify-between p-2 border-b border-slate-300">
                        {/* Logo - Right side in RTL (displayed first) */}
                        <div className="w-24 flex justify-start">
                            {companySettings.companyLogo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={companySettings.companyLogo}
                                    alt="شعار الشركة"
                                    className="w-16 h-16 object-contain"
                                />
                            ) : (
                                <div className="w-16 h-16 border border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                                    الشعار
                                </div>
                            )}
                        </div>

                        {/* Company Name - Centered */}
                        <div className="text-center flex-1">
                            <h1 className="text-lg font-bold text-blue-800 mb-1">{companySettings.companyNameAr}</h1>
                            <h2 className="text-base font-bold border-2 border-blue-800 inline-block px-4 py-1 bg-blue-50">
                                عقد تأجير قاعة
                            </h2>
                        </div>

                        {/* Contract Number - Left side in RTL (displayed last) */}
                        <div className="text-[11px] space-y-0.5 w-24 text-left">
                            <div>رقم العقد: <span className="font-bold">{booking.bookingNumber.split('-').pop()}</span></div>
                            <div>الرقم الضريبي: {companySettings.vatRegNo || 'غير محدد'}</div>
                        </div>
                    </div>

                    {/* Agreement Date */}
                    <div className="p-2 text-center bg-slate-50 border-b border-slate-300 text-[11px]">
                        <p>بعون الله تعالى في يوم <span className="font-bold">{todayHijri}</span> الموافق <span className="font-bold">{todayGregorian}</span> م تم الاتفاق بين كلٍ من:</p>
                    </div>

                    {/* Parties */}
                    <div className="divide-y divide-slate-300">
                        <div className="p-2 flex flex-wrap items-center gap-2">
                            <span className="font-bold text-blue-800">الطرف الأول:</span>
                            <span>{companySettings.companyNameAr}</span>
                        </div>
                        <div className="p-2">
                            <span className="font-bold text-blue-800">الطرف الثاني: </span>
                            <span>{booking.customerName} رقم الهوية {booking.customerIdNumber} رقم الجوال {booking.customerPhone}</span>
                        </div>
                    </div>

                    {/* Rental Details */}
                    <div className="p-2 border-t border-slate-300 bg-slate-50 text-[11px]">
                        <p>على أن يقوم الطرف الأول بتأجير: <span className="font-bold text-blue-800">{booking.hallName}</span> وذلك يوم <span className="font-bold">{dayName}</span> ليلة <span className="font-bold">{nextDayName}</span> تاريخ المناسبة: <span className="font-bold">{hijriDate}</span> الموافق <span className="font-bold">{gregorianDate}</span> م</p>
                    </div>

                    {/* Amount Row */}
                    <div className="p-2 border-t border-slate-300 text-[11px]">
                        <span className="font-bold text-blue-800">وذلك بمبلغ: </span>
                        <span className="font-bold">{numberToArabicWords(total)} ريال فقط لاغير</span>
                    </div>
                </div>

                {/* Terms Section */}
                <div className="border-2 border-slate-800 mb-3">
                    <div className="bg-blue-800 text-white py-1 px-2 text-center font-bold text-[11px]">
                        الشروط والأحكام
                    </div>
                    <div className="p-2">
                        <p className="mb-1 text-[10px] font-bold">وقد اتفق الطرفان بموجب أهليتهما المعتبرة شرعاً ونظاماً على إبرام هذا العقد بالشروط التالية:-</p>
                        <ol className="list-decimal list-inside space-y-1 text-[10px] leading-snug">
                            <li>يتم تكملة العربون إلى نصف قيمة العقد وذلك خلال شهر من كتابة العقد، ولا يحق للطرف الثاني الحصول على أصل العقد إلا بعد دفع نصف قيمة العقد، وفي حالة عدم السداد يلغى الحجز دون الرجوع للطرف الثاني.</li>
                            <li>بعد التوقيع على هذا العقد لا يقبل من الطرفين أي عذر في تأخير الحفل أو تقديمه أو إلغائه، بل يلتزم الطرفان بجميع بنود هذا العقد روحاً ونصاً، ويلتزم الطرف الثاني بدفع المبلغ المتبقي من قيمة هذا العقد.</li>
                            <li>لا يحق للطرف الثاني تحريك أو نقل الأثاث من مكان لآخر إلا بموافقة إدارة القاعة على ذلك وبما يتناسب مع الشكل العام الأساسي للقاعة، ويتحمل الطرف الثاني جميع التلفيات التي قد تحدث على أثاث وفرش وديكورات القاعة.</li>
                            <li>يمنع منعاً باتاً حمل واستعمال السلاح الناري المرخص وغير المرخص في القاعة، كما يمنع إلقاء المحاضرات والخطب بأنواعها أو توزيع الأشرطة والمنشورات، وفي حالة مخالفة هذا البند للطرف الأول الحق في إبلاغ الجهات الرسمية بذلك.</li>
                            <li>يتم تسليم القاعة للطرف الثاني الساعة الخامسة عصراً يوم الحفل، على أن يقوم الطرف الثاني بتسليم القاعة للطرف الأول الساعة الثالثة صباحاً، كما تعتبر القاعة غير مسؤولة عن أية مفقودات داخل القاعة مهما كان نوعها أو قيمتها.</li>
                            <li>يتم حجز البوفيه والضيافة وتنسيقات صالة النساء والكوشة عن طريق إدارة القاعة ويمنع إحضارها من خارج القاعة، ويكون طبخ عشاء الرجال عن طريق طباخ القاعة داخل مطبخ القاعة ويمنع غير ذلك، كما يتحمل الطرف الثاني تكاليف المسلخ ونقل الذبائح للقاعة.</li>
                            <li>تم تحرير هذا العقد لعريس واحد، وفي حالة إضافة عريس ثاني يدفع مبلغ (5000) ريال.</li>
                            <li>لا يسمح بدخول الكوافيرة إلا بموافقة الطرف الأول.</li>
                            <li>حرر هذا العقد من نسختين بيد كل طرف نسخة للعمل بها عند اللزوم، وعند الإخلال بأي من بنود هذا العقد يتم فسخ العقد من قبل الطرف الأول، ولا يحق للطرف الثاني الرجوع على الطرف الأول بأي مطالبات مالية أو غير مالية.</li>
                            <li>يلتزم الطرف الثاني بأن جميع الطلبات والخدمات الإضافية داخل صالة النساء لا تتم إلا عن طريق الطرف الأول.</li>
                            <li>يتحمل الطرف الثاني مبلغ ضريبة القيمة المضافة المقررة عن هذا العقد وملحقاته إن وجدت.</li>
                            <li>يقر الطرف الثاني بأنه قد اطلع ووافق على جميع بنود هذا العقد ويلتزم بكل ما فيه من بنود.</li>
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
                                        <td className="py-1 text-right">إجمالي مبلغ العقد شامل الخدمات</td>
                                        <td className="py-1 font-bold text-left" dir="ltr">{((total / 1.15) + discount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1 text-right">إجمالي الخصم على العقد</td>
                                        <td className="py-1 font-bold text-left" dir="ltr">{discount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1 text-right">إجمالي مبلغ العقد بعد الخصم</td>
                                        <td className="py-1 font-bold text-left" dir="ltr">{(total / 1.15).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1 text-right">ضريبة القيمة المضافة بنسبة (15%)</td>
                                        <td className="py-1 font-bold text-left" dir="ltr">{(total - (total / 1.15)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="border-b border-slate-200">
                                        <td className="py-1 text-right">سندات صرف لصالح العقد</td>
                                        <td className="py-1 font-bold text-left" dir="ltr">{downPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                    <tr className="bg-blue-50">
                                        <td className="py-1 text-right font-bold text-blue-800">صافي مبلغ العقد بعد الضريبة</td>
                                        <td className="py-1 font-bold text-left text-blue-800" dir="ltr">{total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="border-2 border-slate-800 p-2 h-24">
                        <p className="font-bold text-blue-800 mb-2 text-[11px]">الطرف الأول</p>
                        <p className="text-[10px] mb-1">الاسم: {companySettings?.companyNameAr}</p>
                        <p className="text-[10px]">التوقيع: ...........................</p>
                    </div>
                    <div className="border-2 border-slate-800 p-2 h-24">
                        <p className="font-bold text-blue-800 mb-2 text-[11px]">الطرف الثاني</p>
                        <p className="text-[10px] mb-1">الاسم: {booking.customerName}</p>
                        <p className="text-[10px]">التوقيع: ...........................</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t-2 border-blue-800 pt-2 text-center text-[10px] text-slate-600">
                    <p className="font-bold">{companySettings.companyAddress || ''} {companySettings.companyAddressLine2 ? `| ${companySettings.companyAddressLine2}` : ''}</p>
                </div>
            </div>
        </>
    )
}

