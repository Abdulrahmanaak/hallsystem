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
    Star,
    MapPin,
    Play,
    Check,
    Settings,
    Phone,
    Mail,
    Clock,
    Shield,
    Zap,
    FileText,
    Link2,
    Printer,
    Utensils,
    Receipt,
    Menu,
    X,
    MessageCircle
} from 'lucide-react'

// Sticky Navbar Component
function Navbar({ scrolled }: { scrolled: boolean }) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
                <div className="hidden md:flex items-center gap-6 lg:gap-8">
                    <a href="#home" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>الرئيسية</a>
                    <a href="#partners" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>شركاؤنا</a>
                    <a href="#how-it-works" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>كيف يعمل</a>
                    <a href="#features" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>المميزات</a>
                    <a href="#faq" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>الأسئلة</a>
                    <a href="#contact" className={`font-medium transition-colors ${scrolled ? 'text-[#8492a6] hover:text-[#2f55d4]' : 'text-white/80 hover:text-white'
                        }`}>تواصل معنا</a>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-[#2f55d4] p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? (
                        <X className={`${scrolled ? 'text-[#161c2d]' : 'text-white'}`} size={24} />
                    ) : (
                        <Menu className={`${scrolled ? 'text-[#161c2d]' : 'text-white'}`} size={24} />
                    )}
                </button>

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

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5">
                    <a
                        href="#home"
                        className="text-[#8492a6] hover:text-[#2f55d4] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        الرئيسية
                    </a>
                    <a
                        href="#partners"
                        className="text-[#8492a6] hover:text-[#2f55d4] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        شركاؤنا
                    </a>
                    <a
                        href="#how-it-works"
                        className="text-[#8492a6] hover:text-[#2f55d4] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        كيف يعمل
                    </a>
                    <a
                        href="#features"
                        className="text-[#8492a6] hover:text-[#2f55d4] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        المميزات
                    </a>
                    <a
                        href="#contact"
                        className="text-[#8492a6] hover:text-[#2f55d4] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        تواصل معنا
                    </a>

                    <Link
                        href="/login"
                        className="bg-[#2f55d4] text-white py-3 rounded-lg text-center font-bold hover:bg-[#2343ab] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        تسجيل الدخول
                    </Link>
                </div>
            )}
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

function WhatsAppIcon({ size = 24, fill = "currentColor", className = "" }: { size?: number, fill?: string, className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            className={className}
            fill={fill}
        >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
    )
}





export default function LandingPage() {
    const [scrolled, setScrolled] = useState(false)
    const [showFloatingButton, setShowFloatingButton] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            // Show floating button when scrolled past 500px (approx hero height)
            setShowFloatingButton(window.scrollY > 500)
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const whatsappNumber = "966115001451"
    const whatsappMessage = "السلام عليكم، ودي أسمع منكم أكثر عن نظام إدارة القاعات والحجوزات"
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`



    return (
        <div className="min-h-screen bg-white" style={{ direction: 'rtl' }}>
            {/* Navbar */}
            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section id="home" className="relative min-h-screen flex items-center overflow-hidden">
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

                <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-32 grid lg:grid-cols-12 gap-12 items-center">
                    {/* Text Content */}
                    <div className="text-center lg:text-right lg:col-span-5">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
                            <Star size={16} className="text-yellow-400" fill="currentColor" />
                            <span>نظام سحابي متكامل لإدارة القاعات</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                            نظّم إدارة قاعتك (حجوزات، مالية)
                            <span className="block text-blue-200">بسهولة تامة</span>
                        </h1>

                        <p className="text-xl text-white/80 max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto">
                            منصة شاملة لملاك القاعات. أدِر الحجوزات، تابع المصروفات، أصدر فواتير ضريبية، وزامن مع البرامج المحاسبية تلقائياً.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/signup"
                                className="group bg-white text-[#2f55d4] px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <span>ابدأ الآن</span>
                                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                            </Link>

                            <a
                                href="tel:0115001451"
                                className="group bg-transparent border-2 border-white/30 hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <span>اتصال</span>
                                <Phone size={20} />
                            </a>

                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group bg-transparent border-2 border-white/30 hover:border-[#25D366] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#25D366] transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                <span>واتساب</span>
                                <WhatsAppIcon size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Floating Dashboard Mockup */}
                    <div className="relative block lg:block mt-12 lg:mt-0 lg:col-span-7">
                        <div className="relative transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                            <Image
                                src="/images/hero_dashboard_v2.png"
                                alt="واجهة النظام"
                                width={1000}
                                height={700}
                                className="w-full h-auto rounded-2xl shadow-2xl border-4 border-white/20"
                                priority
                            />
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

            {/* Partners & Integrations Bar */}
            <section id="partners" className="py-20 bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-[#8492a6] text-lg font-medium mb-12">
                        شركاء النجاح والأنظمة المتكاملة معنا
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Client Hall */}
                        <div className="flex items-center gap-2">
                            <Image
                                src="/images/partners/hafawah.png"
                                alt="قاعة حفاوة"
                                width={240}
                                height={120}
                                className="object-contain h-28 w-auto"
                            />
                        </div>

                        {/* Qoyod Integration */}
                        <div className="flex items-center gap-2">
                            <Image
                                src="/images/partners/qoyod.png"
                                alt="نظام قيود"
                                width={180}
                                height={90}
                                className="object-contain h-16 w-auto"
                            />
                        </div>

                        {/* ZATCA Compliance */}
                        <div className="flex items-center gap-2">
                            <Image
                                src="/images/partners/zatca.svg"
                                alt="هيئة الزكاة والضريبة والجمارك"
                                width={180}
                                height={90}
                                className="object-contain h-20 w-auto"
                            />
                        </div>
                    </div>
                </div>
            </section>



            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 px-6 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-16">
                        <span className="text-[#2f55d4] font-bold text-sm tracking-wider uppercase">كيف يعمل النظام</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#161c2d] mt-3 mb-4">
                            أربع خطوات للأتمتة الكاملة
                        </h2>
                        <p className="text-lg text-[#8492a6] max-w-2xl mx-auto">
                            من إعداد القاعات إلى المحاسبة - كل شيء مؤتمت
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <ProcessCard
                            icon={Building2}
                            step={1}
                            title="أضف قاعاتك وخدماتك"
                            description="سجل قاعاتك مع الأسعار والخدمات: الوجبات، القهوجية، الذبائح"
                        />
                        <ProcessCard
                            icon={Calendar}
                            step={2}
                            title="استقبل الحجوزات"
                            description="نظام حجز ذكي يدعم الهجري والميلادي مع منع التعارضات"
                        />
                        <ProcessCard
                            icon={FileText}
                            step={3}
                            title="أصدر العقود والفواتير"
                            description="عقود جاهزة للطباعة وفواتير ضريبية متوافقة مع الزكاة"
                        />
                        <ProcessCard
                            icon={Link2}
                            step={4}
                            title="تابع الأرباح والمصروفات"
                            description="سجل المصروفات التشغيلية واعرف صافي ربحك بدقة مع تقارير مفصلة"
                        />
                    </div>
                </div>
            </section>

            {/* Features Section - 6 Epic Features */}
            <section id="features" className="py-24 px-6 bg-[#f8f9fa]">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col items-center text-center mb-16">
                        <span className="text-[#2f55d4] font-bold text-sm tracking-wider uppercase">المميزات الرئيسية</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-[#161c2d] mt-3 mb-4">
                            كل ما تحتاجه لإدارة قاعتك
                        </h2>
                        <p className="text-lg text-[#8492a6] max-w-2xl mx-auto">
                            نظام متكامل يغطي جميع جوانب إدارة القاعات والمناسبات
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1: Calendar */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                            <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                                <Calendar className="text-[#2f55d4]" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#161c2d] mb-3">التقويم الهجري والميلادي</h3>
                            <p className="text-[#8492a6] mb-4 leading-relaxed">
                                احجز بالهجري أو الميلادي مع تحويل تلقائي بينهما. مثالي لحفلات الزفاف والأعياد.
                            </p>
                            <div className="space-y-2">
                                <FeatureItem text="تحويل تلقائي بين التقويمين" />
                                <FeatureItem text="عرض التاريخ الهجري في العقود" />
                                <FeatureItem text="تقويم بصري سهل الاستخدام" />
                            </div>
                        </div>

                        {/* Feature 2: Services */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                            <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors">
                                <Coffee className="text-emerald-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#161c2d] mb-3">الوجبات والضيافة والذبائح</h3>
                            <p className="text-[#8492a6] mb-4 leading-relaxed">
                                نظام متكامل لإدارة كافة الخدمات الإضافية مع حساب التكاليف تلقائياً.
                            </p>
                            <div className="space-y-2">
                                <FeatureItem text="وجبات (فطور/غداء/عشاء/مقبلات)" />
                                <FeatureItem text="القهوجية والضيافة" />
                                <FeatureItem text="الذبائح وأدوات المياه" />
                            </div>
                        </div>

                        {/* Feature 3: Invoicing */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                            <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                                <FileText className="text-purple-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#161c2d] mb-3">فواتير ضريبية متوافقة</h3>
                            <p className="text-[#8492a6] mb-4 leading-relaxed">
                                فواتير احترافية مع ضريبة القيمة المضافة (15%) وسندات قبض رسمية.
                            </p>
                            <div className="space-y-2">
                                <FeatureItem text="ضريبة 15% محسوبة تلقائياً" />
                                <FeatureItem text="طباعة الفواتير والسندات" />
                                <FeatureItem text="تتبع المدفوعات والمتأخرات" />
                            </div>
                        </div>

                        {/* Feature 4: Expenses */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                            <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                                <Receipt className="text-orange-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#161c2d] mb-3">إدارة المصروفات والأرباح</h3>
                            <p className="text-[#8492a6] mb-4 leading-relaxed">
                                سجل فواتير الكهرباء، الصيانة، والرواتب لتعرف صافي ربحك الحقيقي بدقة.
                            </p>
                            <div className="space-y-2">
                                <FeatureItem text="تصنيف المصروفات التشغيلية" />
                                <FeatureItem text="حساب صافي الربح تلقائياً" />
                                <FeatureItem text="تقارير شهرية وسنوية" />
                            </div>
                        </div>

                        {/* Feature 5: Contracts */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                            <div className="w-14 h-14 rounded-xl bg-rose-100 flex items-center justify-center mb-6 group-hover:bg-rose-200 transition-colors">
                                <Printer className="text-rose-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#161c2d] mb-3">عقود جاهزة للطباعة</h3>
                            <p className="text-[#8492a6] mb-4 leading-relaxed">
                                عقود مفصلة تتضمن بنود وشروط الحجز مع بيانات الطرفين والمبالغ.
                            </p>
                            <div className="space-y-2">
                                <FeatureItem text="شروط وأحكام واضحة" />
                                <FeatureItem text="المبلغ بالأرقام والحروف" />
                                <FeatureItem text="جاهزة للطباعة والتوقيع" />
                            </div>
                        </div>

                        {/* Feature 6: Staff & Users */}
                        <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group">
                            <div className="w-14 h-14 rounded-xl bg-cyan-100 flex items-center justify-center mb-6 group-hover:bg-cyan-200 transition-colors">
                                <Users className="text-cyan-600" size={28} />
                            </div>
                            <h3 className="text-xl font-bold text-[#161c2d] mb-3">إدارة الموظفين والصلاحيات</h3>
                            <p className="text-[#8492a6] mb-4 leading-relaxed">
                                امنح موظفيك صلاحيات محددة (مشرف، موظف استقبال) مع سجل تدقيق كامل.
                            </p>
                            <div className="space-y-2">
                                <FeatureItem text="تعدد المستخدمين" />
                                <FeatureItem text="صلاحيات مخصصة لكل دور" />
                                <FeatureItem text="تتبع سجل العمليات" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* FAQ Section */}
            <section id="faq" className="py-20 px-6 bg-white">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-[#161c2d] mb-4">الأسئلة الشائعة</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#f8f9fa] rounded-xl p-6">
                            <h3 className="font-bold text-[#161c2d] mb-2 text-lg">هل النظام معتمد من الزكاة والدخل؟</h3>
                            <p className="text-[#8492a6]">نعم، النظام يصدر فواتير ضريبية إلكترونية متوافقة كلياً مع متطلبات هيئة الزكاة والضريبة والجمارك (FATURAH).</p>
                        </div>

                        <div className="bg-[#f8f9fa] rounded-xl p-6">
                            <h3 className="font-bold text-[#161c2d] mb-2 text-lg">هل يمكنني استخدام النظام من الجوال؟</h3>
                            <p className="text-[#8492a6]">بالتأكيد. النظام سحابي (Cloud-based) ويعمل بكفاءة على جميع الأجهزة: الكمبيوتر، التابلت، والجوال دون الحاجة لتثبيت برامج.</p>
                        </div>

                        <div className="bg-[#f8f9fa] rounded-xl p-6">
                            <h3 className="font-bold text-[#161c2d] mb-2 text-lg">هل بياناتي آمنة؟</h3>
                            <p className="text-[#8492a6]">نحن نستخدم أعلى معايير التشفير (SSL) وسيرفرات محمية، مع نسخ احتياطي دوري لضمان عدم فقدان أي بيانات.</p>
                        </div>
                    </div>
                </div>
            </section>



            {/* CTA Section */}
            <section className="py-20 px-6 bg-[#f8f9fa]">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#161c2d] mb-6">
                        جاهز لأتمتة إدارة قاعتك؟
                    </h2>
                    <p className="text-lg text-[#8492a6] mb-10">
                        انضم للقاعات التي تثق بنظامنا في إدارة الحجوزات والفوترة والمحاسبة
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/signup"
                            className="group bg-[#2f55d4] text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:bg-[#2343ab] transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <span>ابدأ مجاناً</span>
                            <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                        </Link>
                        <a
                            href="tel:0115001451"
                            className="group flex flex-1 sm:flex-none items-center justify-center gap-2 bg-[#161c2d] text-white px-10 py-4 rounded-full font-bold text-lg border-2 border-[#161c2d] hover:bg-[#2c344b] transition-all duration-300"
                        >
                            <span>اتصال</span>
                            <Phone size={20} />
                        </a>
                        <Link
                            href="/login"
                            className="bg-white text-[#161c2d] px-10 py-4 rounded-full font-bold text-lg border-2 border-gray-200 hover:border-[#2f55d4] hover:text-[#2f55d4] transition-all duration-300 flex items-center justify-center"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="contact" className="bg-[#161c2d] text-white py-16 px-6">
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
                            <p className="text-[#8492a6]">
                                تواصل معنا عبر نموذج الموقع أو من خلال لوحة التحكم الخاصة بك.
                            </p>
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
                            {/* Social media links removed as requested */}
                        </div>
                    </div>
                </div>
            </footer>

            {/* Floating WhatsApp Button */}
            <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)] hover:bg-[#20bd5a] transition-all duration-500 transform hover:scale-110 flex items-center justify-center ${showFloatingButton ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
                    }`}
                aria-label="تواصل معنا عبر واتساب"
            >
                <WhatsAppIcon size={32} fill="white" className="text-white" />
            </a>
        </div>
    )
}
