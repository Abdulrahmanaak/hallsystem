'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import {
    Calendar,
    Building2,
    BarChart3,
    Coffee,
    ChevronLeft,
    Users,
    MapPin,
    Play,
    Check,
    Phone,
    Mail,
    Clock,
    Shield,
    Zap,
    FileText,
    Link2,
    Printer,
    Gem
} from 'lucide-react'

// Theme Colors
const COLORS = {
    primary: '#0F4C81',    // Royal Blue
    primaryLight: '#E8F4FC', // Light Blue Background
    accent: '#D4AF37',     // Gold
    text: '#1f2937',       // Gray 800
    textMuted: '#6b7280',  // Gray 500
    surface: '#ffffff',
    background: '#F8FAFC'  // Slate 50
}

// Sticky Navbar Component
function Navbar({ scrolled }: { scrolled: boolean }) {
    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-white shadow-lg py-3'
            : 'bg-white/80 backdrop-blur-md py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <Image
                        src="/images/logo.png"
                        alt="نظام القاعات"
                        width={48}
                        height={48}
                        className="object-contain"
                    />
                    <span className="text-xl font-bold text-[#0F4C81] tracking-wide">
                        نظام القاعات
                    </span>
                </div>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">المميزات</a>
                    <a href="#how-it-works" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">كيف يعمل</a>
                    <a href="#halls" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">القاعات</a>
                </div>

                {/* CTA Button */}
                <Link
                    href="/login"
                    className="px-6 py-2.5 rounded-full font-bold transition-all duration-300 bg-[#0F4C81] text-white hover:bg-[#0a3d68] shadow-lg hover:shadow-xl"
                >
                    تسجيل الدخول
                </Link>
            </div>
        </nav>
    )
}

// Process Card (How It Works)
function ProcessCard({ icon: Icon, step, title, description }: {
    icon: React.ElementType
    step: number
    title: string
    description: string
}) {
    return (
        <div className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100">
            <div className="relative inline-flex mb-6">
                <div className="w-20 h-20 rounded-2xl bg-[#E8F4FC] flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors duration-300">
                    <Icon className="text-[#0F4C81]" size={32} />
                </div>
                <span className="absolute -top-3 -right-3 w-8 h-8 rounded-lg bg-[#D4AF37] text-white text-sm font-bold flex items-center justify-center shadow-lg">
                    {step}
                </span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">{title}</h3>
            <p className="text-gray-500 leading-relaxed text-sm">{description}</p>
        </div>
    )
}

// Feature Item
function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                <Check className="text-[#D4AF37]" size={12} />
            </div>
            <span className="text-gray-600 text-sm">{text}</span>
        </div>
    )
}

// Premium Hall Card
function HallCard({ name, capacity, price, location }: {
    name: string
    capacity: number
    price: number
    location: string
}) {
    return (
        <div className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#D4AF37] shadow-lg hover:shadow-xl transition-all duration-300">
            {/* Image Placeholder */}
            <div className="h-52 bg-gradient-to-br from-[#E8F4FC] to-[#0F4C81]/10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(15, 76, 129, 0.3) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>
                <Building2 className="text-[#0F4C81]/40 group-hover:text-[#0F4C81] group-hover:scale-110 transition-all duration-500" size={64} />

                {/* Price Tag */}
                <div className="absolute top-4 left-4 bg-[#D4AF37] text-white px-3 py-1 rounded-lg font-bold text-sm shadow-lg">
                    {price.toLocaleString()} ر.س
                </div>
            </div>

            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">{name}</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Users size={16} className="text-[#0F4C81]" />
                        <span>السعة: {capacity} شخص</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500">
                        <MapPin size={16} className="text-[#0F4C81]" />
                        <span>{location}</span>
                    </div>
                </div>
                <Link
                    href="/dashboard/halls"
                    className="mt-6 block text-center py-3 rounded-xl border-2 border-[#0F4C81] text-[#0F4C81] font-bold hover:bg-[#0F4C81] hover:text-white transition-all duration-300"
                >
                    عرض التفاصيل
                </Link>
            </div>
        </div>
    )
}

// Stats Counter
function StatItem({ icon, label }: { icon: string; label: string }) {
    return (
        <div className="text-center p-6 rounded-2xl bg-white shadow-md border border-gray-100 hover:border-[#D4AF37] transition-all duration-300">
            <div className="text-4xl mb-4">{icon}</div>
            <h4 className="text-[#0F4C81] font-bold">{label}</h4>
        </div>
    )
}

export default function LandingPage2() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const sampleHalls = [
        { name: 'القاعة الكبرى', capacity: 500, price: 5000, location: 'الدور الأرضي' },
        { name: 'قاعة الحديقة', capacity: 300, price: 3500, location: 'الحديقة الخارجية' },
        { name: 'الجناح الملكي', capacity: 100, price: 1500, location: 'الدور الثاني' }
    ]

    return (
        <div className="min-h-screen bg-white text-gray-800 selection:bg-[#D4AF37] selection:text-white" style={{ direction: 'rtl' }}>
            {/* Navbar */}
            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center pt-20 bg-gradient-to-b from-[#F8FAFC] to-white overflow-hidden">
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230F4C81' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}></div>

                {/* Decorative Glow */}
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#0F4C81]/5 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#D4AF37]/5 rounded-full blur-[100px]"></div>

                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    {/* Text Content */}
                    <div className="text-center lg:text-right">
                        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-4 py-2 rounded-full text-sm font-bold mb-8">
                            <Gem size={16} />
                            <span>نظام إدارة قاعات فاخر</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-8 leading-tight">
                            نظام إدارة
                            <span className="block text-transparent bg-clip-text bg-gradient-to-l from-[#0F4C81] via-[#1e5f99] to-[#D4AF37] mt-2 pb-2">
                                القاعات
                            </span>
                        </h1>

                        <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto">
                            الحل المتكامل لإدارة وتنظيم قاعات المناسبات والزواج بكفاءة.
                            من الحجز إلى التحصيل - كل شيء في منصة واحدة.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/dashboard"
                                className="group bg-[#D4AF37] text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[#B5952F] transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                <span>ابدأ الآن</span>
                                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                            </Link>
                            <button
                                className="flex items-center justify-center gap-3 text-[#0F4C81] font-medium hover:text-[#D4AF37] transition-colors group"
                            >
                                <div className="w-14 h-14 rounded-full bg-[#0F4C81]/10 border border-[#0F4C81]/20 flex items-center justify-center group-hover:bg-[#D4AF37]/10 group-hover:border-[#D4AF37]/30 transition-colors">
                                    <Play size={24} fill="currentColor" className="mr-[-2px]" />
                                </div>
                                <span>شاهد العرض</span>
                            </button>
                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="hidden lg:block relative">
                        <Image
                            src="/images/hero.png"
                            alt="Hall Management System Dashboard"
                            width={700}
                            height={500}
                            className="object-contain drop-shadow-2xl"
                            priority
                        />
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-32 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-[#D4AF37] font-bold tracking-wider uppercase text-sm">رحلة العميل</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 text-gray-800">أتمتة كاملة في 4 خطوات</h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">من إدخال البيانات إلى الإدارة المالية، نظامنا يقوم بالعمل الشاق نيابة عنك</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ProcessCard
                            icon={Building2}
                            step={1}
                            title="أضف قاعاتك"
                            description="سجل بيانات قاعاتك، وسيقوم النظام فوراً بتهيئة الأسعار والخدمات."
                        />
                        <ProcessCard
                            icon={Calendar}
                            step={2}
                            title="استقبل الحجوزات"
                            description="واجهة حجز سهلة تدعم الهجري والميلادي مع كشف تلقائي للتعارضات."
                        />
                        <ProcessCard
                            icon={FileText}
                            step={3}
                            title="أصدر العقود"
                            description="عقود قانونية وفواتير ضريبية جاهزة للطباعة بنقرة زر واحدة."
                        />
                        <ProcessCard
                            icon={Link2}
                            step={4}
                            title="تزامن وتكامل"
                            description="ربط مباشر مع نظام قيود للمحاسبة السلسة دون تدخل يدوي."
                        />
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-32 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="text-[#D4AF37] font-bold tracking-wider uppercase text-sm">إمكانيات النظام</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 text-gray-800">كل ما تحتاجه للنجاح</h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">أدوات احترافية صممت خصيصاً لتلبية احتياجات أصحاب القاعات في المملكة</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-[#D4AF37] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#0F4C81]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-[#E8F4FC] flex items-center justify-center mb-6">
                                    <Calendar className="text-[#0F4C81]" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">التقويم الهجري المعتمد</h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">دعم أصلي للتاريخ الهجري مع تحويل دقيق للميلادي، مما يسهل حجز المناسبات والأعياد.</p>
                                <ul className="space-y-2">
                                    <FeatureItem text="تحويل فوري للتاريخ" />
                                    <FeatureItem text="عرض التقويمين معاً" />
                                </ul>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-[#D4AF37] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6">
                                    <Coffee className="text-emerald-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">إدارة الضيافة والخدمات</h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">تحكم كامل في القهوجية، الوجبات، والذبائح. النظام يحسب التكاليف ويضيفها للفاتورة.</p>
                                <ul className="space-y-2">
                                    <FeatureItem text="إدارة مخزون الخدمات" />
                                    <FeatureItem text="تسعير مرن للمواسم" />
                                </ul>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-[#D4AF37] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6">
                                    <FileText className="text-purple-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">نظام الفوترة المتوافق</h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">فواتير ضريبية إلكترونية متوافقة مع متطلبات الزكاة والدخل (15%) جاهزة للطباعة.</p>
                                <ul className="space-y-2">
                                    <FeatureItem text="QR Code للفواتير" />
                                    <FeatureItem text="سندات قبض وصرف" />
                                </ul>
                            </div>
                        </div>

                        {/* Card 4 */}
                        <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-[#D4AF37] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-6">
                                    <Link2 className="text-orange-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">تكامل محاسبي (قيود)</h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">لا داعي للإدخال المزدوج. كل فاتورة هنا ترحل تلقائياً إلى نظام قيود.</p>
                                <ul className="space-y-2">
                                    <FeatureItem text="مزامنة تلقائية" />
                                    <FeatureItem text="تطابق الحسابات" />
                                </ul>
                            </div>
                        </div>

                        {/* Card 5 */}
                        <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-[#D4AF37] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-rose-100 flex items-center justify-center mb-6">
                                    <Printer className="text-rose-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">طباعة العقود الرسمية</h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">عقود مفصلة تحوي كافة الشروط والأحكام، مع تفقيط المبالغ تلقائياً.</p>
                                <ul className="space-y-2">
                                    <FeatureItem text="شروط قانونية" />
                                    <FeatureItem text="تفقيط الأرقام" />
                                </ul>
                            </div>
                        </div>

                        {/* Card 6 */}
                        <div className="group bg-white p-8 rounded-2xl border border-gray-100 hover:border-[#D4AF37] shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                            <div className="relative">
                                <div className="w-14 h-14 rounded-xl bg-cyan-100 flex items-center justify-center mb-6">
                                    <BarChart3 className="text-cyan-600" size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 mb-3">لوحة تحكم تنفيذية</h3>
                                <p className="text-gray-500 mb-6 text-sm leading-relaxed">رؤية شاملة لأداء قاعاتك: الإيرادات، الحجوزات القادمة، ونسب الإشغال.</p>
                                <ul className="space-y-2">
                                    <FeatureItem text="تقارير لحظية" />
                                    <FeatureItem text="تحليل الأداء" />
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-16 bg-[#0F4C81]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl mb-2">📅</div>
                            <h4 className="text-white font-bold">تقويم هجري</h4>
                            <p className="text-blue-200 text-sm">وميلادي</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-2">🔗</div>
                            <h4 className="text-white font-bold">ربط محاسبي</h4>
                            <p className="text-blue-200 text-sm">مع قيود</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-2">🧾</div>
                            <h4 className="text-white font-bold">فوترة ضريبية</h4>
                            <p className="text-blue-200 text-sm">15% VAT</p>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl mb-2">☕</div>
                            <h4 className="text-white font-bold">إدارة ضيافة</h4>
                            <p className="text-blue-200 text-sm">ووجبات</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Halls Preview */}
            <section id="halls" className="py-32 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-12">
                        <div>
                            <span className="text-[#D4AF37] font-bold tracking-wider uppercase text-sm">مساحاتك</span>
                            <h2 className="text-4xl font-bold mt-2 text-gray-800">القاعات المتاحة</h2>
                        </div>
                        <Link href="/dashboard" className="hidden md:flex items-center gap-2 text-[#0F4C81] hover:text-[#D4AF37] hover:gap-4 transition-all font-medium">
                            <span>عرض الكل</span>
                            <ChevronLeft size={20} />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sampleHalls.map((hall, index) => (
                            <HallCard
                                key={index}
                                name={hall.name}
                                capacity={hall.capacity}
                                price={hall.price}
                                location={hall.location}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#D4AF37] to-[#B5952F]">
                {/* Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}></div>

                <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        هل أنت جاهز للارتقاء بإدارة قاعتك؟
                    </h2>
                    <p className="text-white/90 text-xl mb-10 font-medium">
                        انضم الآن إلى النخبة واستمتع بتجربة إدارة لا تضاهى.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="bg-white text-[#0F4C81] px-10 py-5 rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <span>اشترك مجاناً</span>
                            <ChevronLeft size={20} />
                        </Link>
                        <Link
                            href="/login"
                            className="bg-transparent border-2 border-white text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-white hover:text-[#D4AF37] transition-all duration-300"
                        >
                            دخول الأعضاء
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0F4C81] text-white py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <Image
                                    src="/images/logo.png"
                                    alt="نظام القاعات"
                                    width={40}
                                    height={40}
                                    className="object-contain brightness-0 invert"
                                />
                                <span className="text-2xl font-bold">نظام القاعات</span>
                            </div>
                            <p className="text-blue-200 leading-relaxed text-sm">
                                النظام الأول في المملكة لإدارة قاعات المناسبات باحترافية، ودقة، وأمان.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-[#D4AF37]">روابط هامة</h4>
                            <ul className="space-y-3 text-blue-200 text-sm">
                                <li><Link href="#" className="hover:text-white transition-colors">عن النظام</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">الباقات والأسعار</Link></li>
                                <li><Link href="#" className="hover:text-white transition-colors">سجل التحديثات</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-[#D4AF37]">تواصل معنا</h4>
                            <ul className="space-y-3 text-blue-200 text-sm">
                                <li className="flex items-center gap-3"><Mail size={16} /> info@hallsystem.sa</li>
                                <li className="flex items-center gap-3"><Phone size={16} /> 920000000</li>
                                <li className="flex items-center gap-3"><Clock size={16} /> دعم 24/7</li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-lg mb-6 text-[#D4AF37]">لماذا نحن؟</h4>
                            <ul className="space-y-3 text-blue-200 text-sm">
                                <li className="flex items-center gap-3"><Shield size={16} className="text-emerald-400" /> آمن وموثوق</li>
                                <li className="flex items-center gap-3"><Zap size={16} className="text-emerald-400" /> سريع وفعال</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/10 text-center text-blue-200 text-sm">
                        © {new Date().getFullYear()} نظام إدارة القاعات. جميع الحقوق محفوظة. صمم بفخر في السعودية 🇸🇦
                    </div>
                </div>
            </footer>
        </div>
    )
}
