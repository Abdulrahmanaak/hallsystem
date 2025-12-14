import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import DashboardLayoutClient from './DashboardLayoutClient'

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

    console.log("✅ DashboardLayout: User authenticated:", session.user.username, session.user.role);

    return (
        <DashboardLayoutClient user={session.user}>
            {children}
        </DashboardLayoutClient>
    )
}
