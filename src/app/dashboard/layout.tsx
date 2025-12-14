import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session || !session.user) {
        console.log("⚠️ No session or user found in DashboardLayout, redirecting to login");
        redirect('/login')
    }

    console.log("✅ DashboardLayout: User authenticated:", session.user.username, session.user.role);

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
            {/* Sidebar */}
            <Sidebar user={session.user} />

            {/* Main Content Area */}
            <div className="mr-64"> {/* Margin-right for sidebar in RTL */}
                {/* Header */}
                <Header user={session.user} />

                {/* Page Content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
            {/* Demo Mode Disclaimer */}
            <div className="fixed bottom-0 left-0 right-0 h-8 bg-yellow-100 border-t border-yellow-200 flex items-center justify-center text-xs text-yellow-800 z-50 pointer-events-none">
                <span className="font-bold ml-1">تجريبي:</span>
                <span>يتم عرض بيانات وهمية نظراً لعدم توفر قاعدة البيانات.</span>
            </div>
        </div>
    )
}
