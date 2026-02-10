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
        redirect('/login')
    }

    const { checkSubscriptionStatus } = await import('@/lib/subscription')
    const subscription = await checkSubscriptionStatus(session.user.id)

    return (
        <DashboardLayoutClient user={session.user} subscription={subscription}>
            {children}
        </DashboardLayoutClient>
    )
}
