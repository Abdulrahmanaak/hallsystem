export default async function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-6">
                لوحة التحكم
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
