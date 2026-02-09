
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export default function SubscriptionExpiredPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
                <div className="flex justify-center mb-6">
                    <div className="bg-red-100 p-4 rounded-full">
                        <AlertTriangle className="w-12 h-12 text-red-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                    انتهت صلاحية الاشتراك
                </h1>

                <p className="text-gray-600 mb-8">
                    عفواً، لقد انتهت الفترة التجريبية أو اشتراكك الحالي. يرجى تجديد الاشتراك للمتابعة في استخدام النظام.
                </p>

                <div className="space-y-4">
                    <Link
                        href="https://wa.me/+966552258852?text=السلام%20عليكم%D8%8C%20أرغب%20في%20ترقية%20اشتراكي%20في%20نظام%20إدارة%20القاعات"
                        target="_blank"
                        className="block w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                    >
                        <span>تواصل معنا للتجديد عبر واتساب</span>
                    </Link>

                    <Link
                        href="/dashboard"
                        className="block w-full text-gray-500 hover:text-gray-700 text-sm"
                    >
                        العودة للوحة التحكم (قراءة فقط)
                    </Link>
                </div>
            </div>
        </div>
    )
}
