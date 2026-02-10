'use client'

import { useState, useEffect } from 'react'
import { useSubscription } from '@/hooks/useSubscription'
import {
    Crown,
    Check,
    MessageCircle,
    CalendarDays,
    Building2,
    Users,
    FileText,
    BarChart3,
    Link2,
    Shield,
    Sparkles,
    Clock,
    AlertTriangle
} from 'lucide-react'

const WHATSAPP_NUMBER = '+966552258852'

const plans = [
    {
        id: 'basic',
        nameAr: 'الباقة الأساسية',
        subtitle: 'حجز فقط',
        monthlyPrice: 99,
        yearlyPrice: 999,
        color: 'blue',
        popular: false,
        features: [
            { icon: CalendarDays, text: 'إدارة الحجوزات بالكامل' },
            { icon: Building2, text: 'إدارة القاعات والصالات' },
            { icon: Users, text: 'إدارة العملاء' },
            { icon: FileText, text: 'إصدار الفواتير' },
            { icon: BarChart3, text: 'التقارير المالية الأساسية' },
            { icon: Users, text: 'إضافة مستخدمين فرعيين' },
        ],
    },
    {
        id: 'pro',
        nameAr: 'الباقة الاحترافية',
        subtitle: 'حجز + ربط محاسبي',
        monthlyPrice: 199,
        yearlyPrice: 1999,
        color: 'primary',
        popular: true,
        features: [
            { icon: CalendarDays, text: 'جميع مميزات الباقة الأساسية' },
            { icon: Link2, text: 'ربط تلقائي مع نظام قيود المحاسبي' },
            { icon: BarChart3, text: 'مزامنة الفواتير والمدفوعات' },
            { icon: Shield, text: 'مزامنة بيانات العملاء' },
            { icon: FileText, text: 'تقارير مالية متقدمة' },
            { icon: Sparkles, text: 'أولوية في الدعم الفني' },
        ],
    },
]

function getWhatsAppUrl(planName: string, billing: string) {
    const billingLabel = billing === 'monthly' ? 'شهري' : 'سنوي'
    const message = `السلام عليكم، أرغب في الاشتراك في ${planName} - ${billingLabel}`
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

export default function SubscriptionPage() {
    const [isYearly, setIsYearly] = useState(false)
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
    const subscription = useSubscription()

    // Detect current plan based on qoyodEnabled setting
    useEffect(() => {
        if (subscription.status === 'SUBSCRIBED' && !subscription.isExpired) {
            fetch('/api/settings')
                .then(res => res.json())
                .then(data => {
                    if (data?.qoyodEnabled) {
                        setCurrentPlanId('pro')
                    } else {
                        setCurrentPlanId('basic')
                    }
                })
                .catch(() => setCurrentPlanId(null))
        }
    }, [subscription.status, subscription.isExpired])

    return (
        <div className="max-w-5xl mx-auto">
            {/* Subscription Status Banner */}
            <div className="mb-8">
                <SubscriptionStatusBanner subscription={subscription} />
            </div>

            {/* Page Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-3">
                    اختر الباقة المناسبة لك
                </h1>
                <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto">
                    باقات مرنة تناسب احتياجاتك، بدون عقود طويلة الأمد. يمكنك الترقية أو الإلغاء في أي وقت.
                </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-10">
                <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-[var(--primary-700)]' : 'text-[var(--text-secondary)]'}`}>
                    سنوي
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    وفّر أكثر
                </span>
                <button
                    onClick={() => setIsYearly(!isYearly)}
                    dir="ltr"
                    className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:ring-offset-2 ${isYearly ? 'bg-[var(--primary-600)]' : 'bg-[var(--gray-300)]'
                        }`}
                    aria-label="تبديل بين الاشتراك الشهري والسنوي"
                >
                    <span
                        className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isYearly ? 'translate-x-7' : 'translate-x-0'
                            }`}
                    />
                </button>
                <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-[var(--primary-700)]' : 'text-[var(--text-secondary)]'}`}>
                    شهري
                </span>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
                {plans.map((plan) => {
                    const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
                    const billing = isYearly ? 'yearly' : 'monthly'
                    const monthlyEquivalent = isYearly ? Math.round(plan.yearlyPrice / 12) : null
                    const yearlySavings = isYearly
                        ? plan.monthlyPrice * 12 - plan.yearlyPrice
                        : null
                    const isCurrentPlan = currentPlanId === plan.id

                    return (
                        <div
                            key={plan.id}
                            className={`relative rounded-2xl border-2 transition-all duration-300 hover:shadow-xl ${isCurrentPlan
                                ? 'border-green-500 shadow-lg bg-white ring-1 ring-green-200'
                                : plan.popular
                                    ? 'border-[var(--primary-600)] shadow-lg bg-white'
                                    : 'border-[var(--border-color)] shadow-md bg-white hover:border-[var(--primary-300)]'
                                }`}
                        >
                            {/* Current Plan Badge */}
                            {isCurrentPlan && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-green-600 text-white shadow-md">
                                        <Check size={14} />
                                        باقتك الحالية
                                    </span>
                                </div>
                            )}
                            {/* Popular Badge (only if not current plan) */}
                            {plan.popular && !isCurrentPlan && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold bg-[var(--primary-600)] text-white shadow-md">
                                        <Crown size={14} />
                                        الأكثر طلباً
                                    </span>
                                </div>
                            )}

                            <div className="p-8">
                                {/* Plan Title */}
                                <div className="text-center mb-6">
                                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                                        {plan.nameAr}
                                    </h2>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {plan.subtitle}
                                    </p>
                                </div>

                                {/* Price */}
                                <div className="text-center mb-6">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-5xl font-extrabold text-[var(--text-primary)]">
                                            {price.toLocaleString('ar-SA')}
                                        </span>
                                        <span className="text-lg text-[var(--text-secondary)] font-medium">
                                            ر.س
                                        </span>
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                                        {isYearly ? '/ سنوياً' : '/ شهرياً'}
                                    </p>
                                    {monthlyEquivalent && (
                                        <p className="text-xs text-[var(--primary-600)] font-medium mt-1">
                                            أي {monthlyEquivalent.toLocaleString('ar-SA')} ر.س / شهرياً
                                        </p>
                                    )}
                                    {yearlySavings && yearlySavings > 0 && (
                                        <span className="inline-flex items-center mt-2 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                                            توفير {yearlySavings.toLocaleString('ar-SA')} ر.س سنوياً
                                        </span>
                                    )}
                                </div>

                                {/* Divider */}
                                <div className="border-t border-[var(--border-color)] my-6" />

                                {/* Features */}
                                <ul className="space-y-4 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3">
                                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${plan.popular
                                                ? 'bg-[var(--primary-50)] text-[var(--primary-600)]'
                                                : 'bg-[var(--gray-100)] text-[var(--gray-600)]'
                                                }`}>
                                                <feature.icon size={16} />
                                            </span>
                                            <span className="text-sm text-[var(--text-primary)]">
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA Button */}
                                {isCurrentPlan ? (
                                    <div className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base bg-green-100 text-green-700 cursor-default">
                                        <Check size={20} />
                                        باقتك الحالية
                                    </div>
                                ) : (
                                    <a
                                        href={getWhatsAppUrl(plan.nameAr, billing)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 ${plan.popular
                                            ? 'bg-[#25D366] hover:bg-[#1fb855] text-white shadow-md hover:shadow-lg'
                                            : 'bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white shadow-md hover:shadow-lg'
                                            }`}
                                    >
                                        <MessageCircle size={20} />
                                        {currentPlanId ? 'ترقية عبر واتساب' : 'اشترك الآن عبر واتساب'}
                                    </a>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Trust / FAQ Section */}
            <div className="bg-white rounded-2xl border border-[var(--border-color)] p-8 shadow-sm">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-6 text-center">
                    أسئلة شائعة
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                            هل يمكنني تغيير الباقة لاحقاً؟
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                            نعم، يمكنك الترقية أو تغيير باقتك في أي وقت. تواصل معنا عبر واتساب وسنساعدك فوراً.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                            هل بياناتي آمنة؟
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                            نعم، نستخدم أحدث تقنيات التشفير لحماية بياناتك. جميع البيانات مخزنة بشكل آمن ومشفرة.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                            ما هو الربط المحاسبي؟
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                            الربط المحاسبي يتيح مزامنة الفواتير والمدفوعات تلقائياً مع نظام قيود المحاسبي، مما يوفر وقتك ويقلل الأخطاء.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-[var(--text-primary)] mb-1">
                            هل هناك فترة تجريبية؟
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)]">
                            نعم، نوفر فترة تجريبية مجانية لجميع المستخدمين الجدد لتجربة النظام بكامل مميزاته.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

// -- Subscription Status Banner Component --
function SubscriptionStatusBanner({ subscription }: { subscription: ReturnType<typeof useSubscription> }) {
    if (subscription.status === 'SUBSCRIBED' && !subscription.isExpired) {
        return (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
                <Shield className="text-green-600 flex-shrink-0" size={22} />
                <div>
                    <p className="text-sm font-semibold text-green-800">اشتراكك فعّال</p>
                    <p className="text-xs text-green-600">
                        متبقي {subscription.daysLeft} يوم على انتهاء الاشتراك
                    </p>
                </div>
            </div>
        )
    }

    if (subscription.status === 'TRIAL') {
        return (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-4">
                <Clock className="text-blue-600 flex-shrink-0" size={22} />
                <div>
                    <p className="text-sm font-semibold text-blue-800">أنت في الفترة التجريبية</p>
                    <p className="text-xs text-blue-600">
                        متبقي {subscription.daysLeft} يوم — اشترك الآن للاستمرار بدون انقطاع
                    </p>
                </div>
            </div>
        )
    }

    if (subscription.inGracePeriod) {
        return (
            <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-4">
                <AlertTriangle className="text-orange-600 flex-shrink-0" size={22} />
                <div>
                    <p className="text-sm font-semibold text-orange-800">انتهت فترتك التجريبية</p>
                    <p className="text-xs text-orange-600">
                        لديك مهلة 24 ساعة قبل إيقاف الخدمة. اشترك الآن لتجنب فقدان الوصول.
                    </p>
                </div>
            </div>
        )
    }

    if (subscription.isExpired) {
        return (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
                <AlertTriangle className="text-red-600 flex-shrink-0" size={22} />
                <div>
                    <p className="text-sm font-semibold text-red-800">الاشتراك منتهي</p>
                    <p className="text-xs text-red-600">
                        حسابك في وضع القراءة فقط. اشترك الآن لاستعادة جميع المميزات.
                    </p>
                </div>
            </div>
        )
    }

    return null
}
