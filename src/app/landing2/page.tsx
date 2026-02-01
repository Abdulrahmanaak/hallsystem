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
    Gem,
    Menu,
    X,
    Quote
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
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
                    <a href="#home" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">الرئيسية</a>
                    <a href="#partners" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">شركاؤنا</a>
                    <a href="#how-it-works" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">كيف يعمل</a>
                    <a href="#features" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">المميزات</a>
                    <a href="#faq" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">الأسئلة</a>
                    <a href="#contact" className="text-gray-600 hover:text-[#0F4C81] transition-colors font-medium">تواصل معنا</a>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-[#0F4C81] p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>

                {/* CTA Button */}
                <Link
                    href="/login"
                    className="px-6 py-2.5 rounded-full font-bold transition-all duration-300 bg-[#0F4C81] text-white hover:bg-[#0a3d68] shadow-lg hover:shadow-xl"
                >
                    تسجيل الدخول
                </Link>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-gray-100 py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-5">
                    <a
                        href="#home"
                        className="text-gray-600 hover:text-[#0F4C81] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        الرئيسية
                    </a>
                    <a
                        href="#partners"
                        className="text-gray-600 hover:text-[#0F4C81] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        شركاؤنا
                    </a>
                    <a
                        href="#how-it-works"
                        className="text-gray-600 hover:text-[#0F4C81] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        كيف يعمل
                    </a>
                    <a
                        href="#features"
                        className="text-gray-600 hover:text-[#0F4C81] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        المميزات
                    </a>
                    <a
                        href="#faq"
                        className="text-gray-600 hover:text-[#0F4C81] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        الأسئلة
                    </a>
                    <a
                        href="#contact"
                        className="text-gray-600 hover:text-[#0F4C81] font-medium py-2"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        تواصل معنا
                    </a>

                    <Link
                        href="/login"
                        className="bg-[#0F4C81] text-white py-3 rounded-lg text-center font-bold hover:bg-[#0a3d68] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        تسجيل الدخول
                    </Link>
                </div>
            )}
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





export default function LandingPage2() {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])



    return (
        <div className="min-h-screen bg-white text-gray-800 selection:bg-[#D4AF37] selection:text-white" style={{ direction: 'rtl' }}>
            {/* Navbar */}
            <Navbar scrolled={scrolled} />

            {/* Hero Section */}
            <section id="home" className="relative min-h-screen flex items-center pt-20 bg-gradient-to-b from-[#F8FAFC] to-white overflow-hidden">
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
                                القاعات الشامل
                            </span>
                        </h1>

                        <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed lg:mx-0 mx-auto">
                            الحل المتكامل لإدارة القاعات: حجوزات، عقود، مصروفات، وفواتير ضريبية. منصة واحدة تغنيك عن عشرة برامج.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/dashboard"
                                className="group bg-[#D4AF37] text-white px-10 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:bg-[#B5952F] transition-all duration-300 flex items-center justify-center gap-3"
                            >
                                <span>ابدأ الآن</span>
                                <ChevronLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                            </Link>

                        </div>
                    </div>

                    {/* Hero Image */}
                    <div className="relative block lg:block mt-12 lg:mt-0">
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

            {/* How It Works */}
            <section id="how-it-works" className="py-32 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-20">
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
                            icon={BarChart3}
                            step={4}
                            title="راقب أرباحك"
                            description="تقارير مالية دقيقة توضح لك الإيرادات والمصروفات وصافي الربح."
                        />
                    </div>
                </div>
            </section>

            {/* Zig-Zag Features Section */}
            <section id="features" className="py-32 bg-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-24">
                        <span className="text-[#D4AF37] font-bold tracking-wider uppercase text-sm">إمكانيات النظام</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4 text-gray-800">تجربة إدارة استثنائية</h2>
                        <p className="text-gray-500 text-lg max-w-2xl mx-auto">صمم ليعطيك السيطرة الكاملة على قاعتك بأناقة وذكاء</p>
                    </div>

                    <div className="space-y-32">
                        {/* Feature 1: Booking */}
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-[#0F4C81]/5 rounded-3xl transform rotate-3"></div>
                                    <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center min-h-[300px]">
                                        <div className="text-center">
                                            <Calendar size={64} className="text-[#0F4C81] mx-auto mb-6" />
                                            <div className="text-lg font-bold text-gray-800 mb-2">التقويم الذكي</div>
                                            <div className="text-sm text-gray-400">Hijri & Gregorian Calendar</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2 text-right">
                                <div className="w-16 h-16 rounded-2xl bg-[#E8F4FC] flex items-center justify-center mb-6">
                                    <Calendar className="text-[#0F4C81]" size={32} />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-800 mb-4">منع التعارضات، تلقائياً</h3>
                                <p className="text-gray-500 text-lg leading-relaxed mb-6">
                                    وداعاً لدفاتر الحجز الورقية. نظامنا الذكي يكتشف التعارضات فوراً، ويدعم التحويل المباشر بين التاريخ الهجري والميلادي لضمان دقة مواعيدك.
                                </p>
                                <ul className="space-y-3">
                                    <FeatureItem text="تزامن فوري للحجوزات" />
                                    <FeatureItem text="عقود إلكترونية جاهزة للطباعة" />
                                </ul>
                            </div>
                        </div>

                        {/* Feature 2: Finance (Reversed) */}
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-1 lg:order-1 text-right">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                                    <BarChart3 className="text-emerald-600" size={32} />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-800 mb-4">كل ريال، محسوب</h3>
                                <p className="text-gray-500 text-lg leading-relaxed mb-6">
                                    تتبع الإيرادات، سجل المصروفات التشغيلية، واعرف صافي ربحك لحظياً. مع ربط محاسبي مباشر (قيود) وفواتير ضريبية معتمدة.
                                </p>
                                <ul className="space-y-3">
                                    <FeatureItem text="فواتير ضريبية (VAT 15%)" />
                                    <FeatureItem text="تقارير الأرباح والمصروفات" />
                                </ul>
                            </div>
                            <div className="order-2 lg:order-2">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-emerald-500/5 rounded-3xl transform -rotate-3"></div>
                                    <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center min-h-[300px]">
                                        <div className="text-center">
                                            <BarChart3 size={64} className="text-emerald-600 mx-auto mb-6" />
                                            <div className="text-lg font-bold text-gray-800 mb-2">لوحة التحكم المالية</div>
                                            <div className="text-sm text-gray-400">Financial Dashboard</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Feature 3: Staff Security */}
                        <div className="grid lg:grid-cols-2 gap-16 items-center">
                            <div className="order-2 lg:order-1">
                                <div className="relative">
                                    <div className="absolute -inset-4 bg-cyan-500/5 rounded-3xl transform rotate-3"></div>
                                    <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center min-h-[300px]">
                                        <div className="text-center">
                                            <Shield size={64} className="text-cyan-600 mx-auto mb-6" />
                                            <div className="text-lg font-bold text-gray-800 mb-2">أمان عالي</div>
                                            <div className="text-sm text-gray-400">Role-Based Access</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 lg:order-2 text-right">
                                <div className="w-16 h-16 rounded-2xl bg-cyan-100 flex items-center justify-center mb-6">
                                    <Users className="text-cyan-600" size={32} />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-800 mb-4">تحكم بمن يرى ماذا</h3>
                                <p className="text-gray-500 text-lg leading-relaxed mb-6">
                                    لا تدع بياناتك المالية مشاعة. حدد صلاحيات دقيقة لموظفي الاستقبال، بينما تحتفظ أنت بالصلاحيات الكاملة كمالك للقاعة.
                                </p>
                                <ul className="space-y-3">
                                    <FeatureItem text="صلاحيات مخصصة لكل موظف" />
                                    <FeatureItem text="سجل مراقبة العمليات" />
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section - Hidden as requested */}
            {/* <section className="py-24 bg-[#F8FAFC]">
                ...
            </section> */}





            {/* FAQ Section */}
            <section id="faq" className="py-24 px-6 bg-white border-t border-gray-100">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-[#0F4C81] font-bold tracking-wider uppercase text-sm">أسئلة شائعة</span>
                        <h2 className="text-3xl font-bold text-gray-800 mt-3 mb-4">كل ما تود معرفته</h2>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-gray-100 text-center">
                            <h3 className="font-bold text-gray-800 mb-3 text-lg">هل النظام معتمد من الزكاة والدخل؟</h3>
                            <p className="text-gray-500 leading-relaxed">نعم، النظام يصدر فواتير ضريبية إلكترونية متوافقة كلياً مع متطلبات هيئة الزكاة والضريبة والجمارك (FATURAH).</p>
                        </div>

                        <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-gray-100 text-center">
                            <h3 className="font-bold text-gray-800 mb-3 text-lg">هل يمكنني استخدام النظام من الجوال؟</h3>
                            <p className="text-gray-500 leading-relaxed">بالتأكيد. النظام سحابي (Cloud-based) ويعمل بكفاءة على جميع الأجهزة: الكمبيوتر، التابلت، والجوال دون الحاجة لتثبيت برامج.</p>
                        </div>

                        <div className="bg-[#F8FAFC] rounded-2xl p-8 border border-gray-100 text-center">
                            <h3 className="font-bold text-gray-800 mb-3 text-lg">هل بياناتي آمنة؟</h3>
                            <p className="text-gray-500 leading-relaxed">نحن نستخدم أعلى معايير التشفير (SSL) وسيرفرات محمية، مع نسخ احتياطي دوري لضمان عدم فقدان أي بيانات.</p>
                        </div>
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
                    <span className="text-white/80 font-bold tracking-widest uppercase text-sm mb-4 block">انضم للنخبة</span>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        حول قاعتك إلى <br /> مشروع مؤسسي ناجح
                    </h2>
                    <p className="text-white/90 text-xl mb-12 font-medium max-w-2xl mx-auto">
                        آلاف الريالات تضيع بسبب سوء الإدارة. ابدأ اليوم بضبط الأمور.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/dashboard"
                            className="bg-white text-[#0F4C81] px-12 py-5 rounded-full font-bold text-xl shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <span>ابدأ النسخة التجريبية</span>
                            <ChevronLeft size={24} />
                        </Link>
                    </div>
                </div>
            </section>



            {/* Footer */}
            <footer id="contact" className="bg-[#0F4C81] text-white py-20 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
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
                            <h4 className="font-bold text-lg mb-6 text-[#D4AF37]">تواصل معنا</h4>
                            <p className="text-blue-200 text-sm leading-relaxed">
                                تواصل معنا عبر نموذج الموقع أو من خلال لوحة التحكم الخاصة بك.
                            </p>
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
