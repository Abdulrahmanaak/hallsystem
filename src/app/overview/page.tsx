import Link from 'next/link'
import { ChevronLeft, Phone } from 'lucide-react'

export const metadata = {
    title: 'نظرة عامة - نظام القاعات',
    description: 'فيديو تعريفي بنظام إدارة القاعات'
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

export default function OverviewPage() {
    const whatsappNumber = "966115001451"
    const whatsappMessage = "السلام عليكم، اطلعت على الفيديو التعريفي وباقي عندي بعض الاستفسارات حول نظام القاعات."
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden" style={{ direction: 'rtl' }}>
            {/* Main Content - Centered */}
            <main className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-6 w-full py-4">


                {/* Video Container - Optimized Height */}
                <div className="w-full max-w-4xl mx-auto bg-gray-50 p-2 rounded-2xl shadow-lg border border-gray-100 mb-6">
                    <div className="relative aspect-video max-h-[50vh] rounded-xl overflow-hidden bg-black flex items-center justify-center w-full mx-auto">
                        <iframe
                            className="absolute top-0 left-0 w-full h-full"
                            src="https://www.youtube.com/embed/IRyreCjoAEo?rel=0"
                            title="نظرة عامة على النظام"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>

                {/* CTA Buttons */}
                <div className="text-center flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-2xl mx-auto">
                    {/* Primary Signup Button */}
                    <Link
                        href="/signup"
                        className="group flex flex-1 items-center justify-center gap-2 bg-[#2f55d4] text-white px-6 py-3 rounded-lg font-bold text-base shadow-md hover:bg-[#2343ab] transition-all duration-300 w-full text-center"
                    >
                        <span className="w-full text-center">سجل حسابك مجاناً</span>
                    </Link>

                    {/* Call Button */}
                    <a
                        href="tel:0115001451"
                        className="group flex flex-1 items-center justify-center gap-2 bg-[#161c2d] text-white px-6 py-3 rounded-lg font-bold text-base shadow-md hover:bg-[#2c344b] transition-all duration-300 w-full"
                    >
                        <span>اتصال</span>
                        <Phone size={20} />
                    </a>

                    {/* WhatsApp Button */}
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-1 items-center justify-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-lg font-bold text-base shadow-md hover:bg-[#20bd5a] transition-all duration-300 w-full"
                    >
                        <span>تواصل عبر الواتساب</span>
                        <WhatsAppIcon size={20} />
                    </a>
                </div>
            </main>

            <footer className="py-3 text-center flex-shrink-0">
                <p className="text-[#8492a6] text-xs font-medium">
                    © {new Date().getFullYear()} نظام إدارة القاعات. جميع الحقوق محفوظة
                </p>
            </footer>
        </div>
    )
}
