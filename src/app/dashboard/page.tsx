import Link from 'next/link'

export default async function DashboardPage() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                    لوحة التحكم
                </h1>
                <Link id="tour-new-booking-btn" href="/dashboard/bookings/new" className="bg-[var(--primary-600)] text-white px-4 py-2 rounded-lg hover:bg-[var(--primary-700)] transition-colors flex items-center gap-2">
                    <span className="text-xl">+</span>
                    <span>حجز جديد</span>
                </Link>
            </div>

            <div id="tour-stats-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stats Cards - Will be implemented next */}
                <div className="card">
                    <div className="text-sm text-[var(--text-secondary)] mb-1">
                        إجمالي الحجوزات
                    </div>
                    <div className="text-3xl font-bold text-[var(--primary-700)]">
                        0
                    </div>
                </div>

                <div className="card">
                    <div className="text-sm text-[var(--text-secondary)] mb-1">
                        الحجوزات المؤكدة
                    </div>
                    <div className="text-3xl font-bold text-[var(--success)]">
                        0
                    </div>
                </div>

                <div className="card">
                    <div className="text-sm text-[var(--text-secondary)] mb-1">
                        الحجوزات المعلقة
                    </div>
                    <div className="text-3xl font-bold text-[var(--warning)]">
                        0
                    </div>
                </div>

                <div className="card">
                    <div className="text-sm text-[var(--text-secondary)] mb-1">
                        إجمالي الإيرادات
                    </div>
                    <div className="text-3xl font-bold text-[var(--primary-700)]">
                        ٠ ريال
                    </div>
                </div>
            </div>

            <div className="card">
                <h2 className="text-lg font-semibold mb-4">مرحباً بك في نظام إدارة القاعات</h2>
                <p className="text-[var(--text-secondary)]">
                    قم بإدارة الحجوزات والعملاء والقاعات من القائمة الجانبية
                </p>
            </div>
        </div>
    )
}
