'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
    Calendar,
    Building2,
    BarChart3,
    Coffee,
    ChevronLeft,
    Users,
    Star,
    MapPin,
    Play,
    Check,
    Settings,
    Phone,
    Mail,
    Clock,
    Shield,
    Zap
} from 'lucide-react'

// Sticky Navbar Component
function Navbar({ scrolled }: { scrolled: boolean }) {
    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-white shadow-lg py-3'
                : 'bg-transparent py-5'
            }`}>
            <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${scrolled ? 'bg-[#2f55d4]' : 'bg-white/20'
                        }`}>
                        <Building2 className="text-white" size={24} />
                    </div>
                    <span className={`text-xl font-bold ${scrolled ? 'text-[#161c2d]' : 'text-white'}`}>
                        نظام القاعات
                    </span>
                </div>

                {/* Nav Links */}
                <div className="hidden md:flex items-center gap-8">
                    <a href="#features" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>المميزات</a>
                    <a href="#how-it-works" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>كيف يعمل</a>
                    <a href="#halls" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>القاعات</a>
                </div>

                {/* CTA Button */}
                <Link
                    href="/login"
                    className={`px-6 py-2.5 rounded-full font-bold transition-all duration-300 ${scrolled
                            ? 'bg-[#2f55d4] text-white hover:bg-[#2343ab] shadow-lg'
                            : 'bg-white text-[#2f55d4] hover:bg-white/90'
                        }`}
                >
                    تسجيل الدخول
                </Link>
            </div>
        </nav>
    )
}

// How It Works Card
function ProcessCard({ icon: Icon, step, title, description }: {
    icon: React.ElementType
    step: number
    title: string
    description: string
}) {
    return (
        <div className="text-center group">
            <div className="relative inline-flex mb-6">
                <div className="w-24 h-24 rounded-full bg-[#e8eef8] flex items-center justify-center group-hover:bg-[#c6d4f0] transition-colors duration-300">
                    <Icon className="text-[#2f55d4]" size={40} />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#2f55d4] text-white text-sm font-bold flex items-center justify-center">
                    {step}
                </span>
            </div>
            <h3 className="text-xl font-bold text-[#161c2d] mb-3">{title}</h3>
            <p className="text-[#8492a6] leading-relaxed">{description}</p>
        </div>
    )
}

// Feature Item with Check
function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 mb-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check className="text-emerald-500" size={14} />
            </div>
            <span className="text-[#8492a6]">{text}</span>
        </div>
    )
}

// Hall Preview Card
function HallCard({ name, capacity, price, location }: {
    name: string
    capacity: number
    price: number
    location: string
}) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-100">
            {/* Image Placeholder */}
            <div className="h-52 bg-gradient-to-br from-[#5576d6] to-[#2f55d4] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>
                <Building2 className="text-white/80 group-hover:scale-110 transition-transform duration-500" size={64} />
            </div>
            <div className="p-6">
                <h3 className="text-xl font-bold text-[#161c2d] mb-4">{name}</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-3 text-[#8492a6]">
                        <Users size={18} className="text-[#2f55d4]" />
                        <span>السعة: {capacity} شخص</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#8492a6]">
                        <Star size={18} className="text-yellow-500 fill-yellow-500" />
                        <span>يبدأ من {price.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex items-center gap-3 text-[#8492a6]">
                        <MapPin size={18} className="text-[#2f55d4]" />
                        <span>{location}</span>
                    </div>
                </div>
                <Link
                    href="/dashboard/halls"
                    className="mt-5 block text-center py-3 rounded-full border-2 border-[#2f55d4] text-[#2f55d4] font-bold hover:bg-[#2f55d4] hover:text-white transition-all duration-300"
                >
                    عرض التفاصيل
                </Link>
            </div>
        </div>
    )
}

// Stats Counter
function StatItem({ value, label }: { value: string; label: string }) {
    return (
        <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{value}</div>
            <div className="text-blue-200 text-sm md:text-base">{label}</div>
        </div>
    )
}

export default function LandingPage() {
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
        <div className="min-h-screen bg-white" style={{ direction: 'rtl' }}>
            {/* Navbar */}
            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#2a4cc0] via-[#2f55d4] to-[#2343ab]" />

                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                }}></div>

                {/* Decorative Circles */}
                <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
                <div className="absolute bottom-20 left-20 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl"></div>

                <div className="relative max-w-7xl mx-auto px-6 py-32 grid lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content */}
                    <div className="text-center lg:text-right">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                            <Zap size={16} />
                            <span>الحل الأمثل لإدارة القاعات</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            نظام إدارة القاعات
                            <span className="block text-blue-200">المتكامل</span>
                        </h1>

                        <p className="text-xl text-white/80 max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto">
                            أدر حجوزات القاعات والمناسبات بكفاءة عالية مع نظام شامل
                            يدعم إدارة الخدمات والتقارير المالية
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/dashboard"
                                className="group bg-white text-[#2f55d4] px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <span>ابدأ الآن</span>
                                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                            </Link>
                            <button
                                className="flex items-center justify-center gap-3 text-white font-medium hover:text-white/80 transition-colors"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <Play size={20} fill="white" className="text-white mr-[-2px]" />
                                </div>
                                <span>شاهد الفيديو</span>
                            </button>
                        </div>
                    </div>

                    {/* Floating Dashboard Mockup */}
                    <div className="relative hidden lg:block">
                        <div className="relative bg-white rounded-2xl shadow-2xl p-4 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                            <div className="bg-gray-100 rounded-xl p-6">
                                {/* Mock Dashboard Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-[#2f55d4] flex items-center justify-center">
                                            <Building2 className="text-white" size={20} />
                                        </div>
                                        <div>
                                            <div className="h-3 w-24 bg-gray-300 rounded"></div>
                                            <div className="h-2 w-16 bg-gray-200 rounded mt-1"></div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                        <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                                    </div>
                                </div>
                                {/* Mock Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="bg-white rounded-lg p-4 shadow-sm">
                                            <div className="h-2 w-12 bg-gray-200 rounded mb-2"></div>
                                            <div className="h-4 w-16 bg-blue-200 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                {/* Mock Table */}
                                <div className="bg-white rounded-lg p-4 shadow-sm">
                                    <div className="h-3 w-20 bg-gray-200 rounded mb-4"></div>
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                                            <div className="w-8 h-8 rounded-full bg-blue-100"></div>
                                            <div className="flex-1">
                                                <div className="h-2 w-full bg-gray-100 rounded"></div>
                                            </div>
                                            <div className="h-2 w-16 bg-emerald-100 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {/* Decorative Elements */}
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-300/30 rounded-full blur-xl"></div>
                    </div>
                </div>

                {/* Wave Divider */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
                    </svg>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[#2f55d4] font-bold text-sm tracking-wider uppercase">كيف يعمل النظام</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#161c2d] mt-3 mb-4">
                            ثلاث خطوات بسيطة
                        </h2>
                        <p className="text-lg text-[#8492a6] max-w-2xl mx-auto">
                            ابدأ في إدارة قاعاتك بكفاءة في دقائق معدودة
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <ProcessCard
                            icon={Building2}
                            step={1}
                            title="أضف قاعاتك"
                            description="سجل معلومات القاعات والأسعار والخدمات المتاحة بسهولة"
                        />
                        <ProcessCard
                            icon={Calendar}
                            step={2}
                            title="استقبل الحجوزات"
                            description="أدر حجوزات العملاء مع دعم التقويم الهجري والميلادي"
                        />
                        <ProcessCard
                            icon={BarChart3}
                            step={3}
                            title="تابع التقارير"
                            description="احصل على تقارير مالية شاملة وإحصائيات الأداء"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section - Alternating */}
            <section id="features" className="py-24 px-6 bg-[#f8f9fa]">
                <div className="max-w-7xl mx-auto">
                    {/* Feature 1 - Image Left */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
                        <div className="order-2 lg:order-1">
                            <div className="bg-white rounded-2xl shadow-xl p-8 relative">
                                <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-100 rounded-full blur-xl"></div>
                                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex items-center justify-center min-h-[300px]">
                                    <Calendar className="text-[#5576d6]" size={120} />
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <span className="text-[#2f55d4] font-bold text-sm tracking-wider uppercase">إدارة الحجوزات</span>
                            <h3 className="text-3xl font-bold text-[#161c2d] mt-3 mb-6">
                                نظام حجوزات متكامل وسهل الاستخدام
                            </h3>
                            <p className="text-[#8492a6] text-lg mb-6 leading-relaxed">
                                تمتع بنظام حجوزات شامل يتيح لك إدارة جميع مناسباتك بكفاءة عالية مع دعم كامل للتقويم الهجري.
                            </p>
                            <div className="space-y-1">
                                <FeatureItem text="دعم التقويم الهجري والميلادي" />
                                <FeatureItem text="إدارة حالات الحجز المتعددة" />
                                <FeatureItem text="إشعارات تلقائية للعملاء" />
                                <FeatureItem text="تقارير الحجوزات اليومية والشهرية" />
                            </div>
                            <Link href="/dashboard/bookings" className="inline-flex items-center gap-2 mt-8 px-8 py-3 rounded-full bg-[#2f55d4] text-white font-bold hover:bg-[#2343ab] transition-all shadow-lg">
                                <span>اكتشف المزيد</span>
                                <ChevronLeft size={18} />
                            </Link>
                        </div>
                    </div>

                    {/* Feature 2 - Image Right */}
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-[#2f55d4] font-bold text-sm tracking-wider uppercase">خدمات إضافية</span>
                            <h3 className="text-3xl font-bold text-[#161c2d] mt-3 mb-6">
                                إدارة الضيافة والوجبات والذبائح
                            </h3>
                            <p className="text-[#8492a6] text-lg mb-6 leading-relaxed">
                                نظام متكامل لإدارة جميع الخدمات الإضافية مع حساب التكاليف تلقائياً وربطها بالحجوزات.
                            </p>
                            <div className="space-y-1">
                                <FeatureItem text="إدارة عمال الضيافة (القهوجية)" />
                                <FeatureItem text="إدارة الوجبات والتكاليف" />
                                <FeatureItem text="حساب تلقائي للتكاليف الإجمالية" />
                                <FeatureItem text="فواتير تفصيلية شاملة" />
                            </div>
                            <Link href="/dashboard/halls" className="inline-flex items-center gap-2 mt-8 px-8 py-3 rounded-full border-2 border-[#2f55d4] text-[#2f55d4] font-bold hover:bg-[#2f55d4] hover:text-white transition-all">
                                <span>عرض القاعات</span>
                                <ChevronLeft size={18} />
                            </Link>
                        </div>
                        <div>
                            <div className="bg-white rounded-2xl shadow-xl p-8 relative">
                                <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-emerald-100 rounded-full blur-xl"></div>
                                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 flex items-center justify-center min-h-[300px]">
                                    <Coffee className="text-[#5576d6]" size={120} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-20 px-6 bg-gradient-to-l from-[#2a4cc0] to-[#2343ab] relative overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '25px 25px'
                }}></div>

                <div className="max-w-5xl mx-auto relative">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <StatItem value="+100" label="حجز ناجح" />
                        <StatItem value="+10" label="قاعة متاحة" />
                        <StatItem value="%98" label="رضا العملاء" />
                        <StatItem value="24/7" label="دعم متواصل" />
                    </div>
                </div>
            </section>

            {/* Halls Preview Section */}
            <section id="halls" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[#2f55d4] font-bold text-sm tracking-wider uppercase">قاعاتنا</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#161c2d] mt-3 mb-4">
                            اكتشف قاعاتنا المميزة
                        </h2>
                        <p className="text-lg text-[#8492a6] max-w-2xl mx-auto">
                            مجموعة متنوعة من القاعات لجميع المناسبات والاحتياجات
                        </p>
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

            {/* CTA Section */}
            <section className="py-20 px-6 bg-[#f8f9fa]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#161c2d] mb-6">
                        جاهز لإدارة قاعاتك بكفاءة؟
                    </h2>
                    <p className="text-lg text-[#8492a6] mb-10">
                        ابدأ الآن واستمتع بتجربة إدارة سلسة ومتكاملة
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="group bg-[#2f55d4] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-[#2343ab] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <span>ابدأ مجاناً</span>
                            <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                        </Link>
                        <Link
                            href="/login"
                            className="bg-white text-[#161c2d] px-10 py-4 rounded-full font-bold text-lg border-2 border-gray-200 hover:border-[#2f55d4] hover:text-[#2f55d4] transition-all duration-300"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#161c2d] text-white py-16 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-[#2f55d4] rounded-xl flex items-center justify-center">
                                    <Building2 className="text-white" size={28} />
                                </div>
                                <span className="text-2xl font-bold">نظام القاعات</span>
                            </div>
                            <p className="text-[#8492a6] leading-relaxed">
                                الحل الأمثل لإدارة القاعات والمناسبات بكفاءة واحترافية عالية
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="font-bold text-lg mb-6">روابط سريعة</h4>
                            <ul className="space-y-3 text-[#8492a6]">
                                <li><Link href="/dashboard" className="hover:text-white transition-colors">لوحة التحكم</Link></li>
                                <li><Link href="/dashboard/bookings" className="hover:text-white transition-colors">الحجوزات</Link></li>
                                <li><Link href="/dashboard/halls" className="hover:text-white transition-colors">القاعات</Link></li>
                                <li><Link href="/login" className="hover:text-white transition-colors">تسجيل الدخول</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="font-bold text-lg mb-6">تواصل معنا</h4>
                            <ul className="space-y-3 text-[#8492a6]">
                                <li className="flex items-center gap-3">
                                    <Mail size={18} className="text-[#5576d6]" />
                                    <span>info@hallsystem.com</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Phone size={18} className="text-[#5576d6]" />
                                    <span>+966 XX XXX XXXX</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Clock size={18} className="text-[#5576d6]" />
                                    <span>24/7 دعم متواصل</span>
                                </li>
                            </ul>
                        </div>

                        {/* Features */}
                        <div>
                            <h4 className="font-bold text-lg mb-6">المميزات</h4>
                            <ul className="space-y-3 text-[#8492a6]">
                                <li className="flex items-center gap-3">
                                    <Shield size={18} className="text-emerald-500" />
                                    <span>آمن وموثوق</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Zap size={18} className="text-emerald-500" />
                                    <span>سريع وفعال</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <Settings size={18} className="text-emerald-500" />
                                    <span>قابل للتخصيص</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-[#8492a6] text-sm">
                            © {new Date().getFullYear()} نظام إدارة القاعات. جميع الحقوق محفوظة
                        </p>
                        <div className="flex gap-4">
                            {['facebook', 'twitter', 'instagram'].map((social) => (
                                <a
                                    key={social}
                                    href="#"
                                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-[#8492a6] hover:bg-[#2f55d4] hover:border-[#2f55d4] hover:text-white transition-all"
                                >
                                    <span className="sr-only">{social}</span>
                                    <div className="w-4 h-4 bg-current rounded-sm"></div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
