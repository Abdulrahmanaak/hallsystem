'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { TourProvider } from '@/components/tutorial/TourProvider'
import { SubscriptionProvider } from '@/providers/SubscriptionProvider'
import type { UserRole } from '@/types/enums'
import '@/app/tutorial.css'

import Link from 'next/link'
import { AlertTriangle, Clock } from 'lucide-react'
import type { SubscriptionState } from '@/lib/subscription'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user: {
        nameAr: string
        role: UserRole
    }
    subscription: SubscriptionState
}

import { UserProvider } from '@/providers/UserProvider'

export default function DashboardLayoutClient({ children, user, subscription }: DashboardLayoutClientProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Trial Expired Banner
    const showBanner = subscription.isExpired || subscription.inGracePeriod

    return (
        <TourProvider>
            <SubscriptionProvider value={subscription}>
                <UserProvider user={user}>
                    <div className="min-h-screen bg-[var(--bg-secondary)] pb-20">
                        {/* Subscription Banner */}
                        {showBanner && (
                            <div className={`${subscription.inGracePeriod ? 'bg-orange-500' : 'bg-red-600'} text-white px-4 py-3 text-center relative z-[60]`}>
                                <div className="flex items-center justify-center gap-2 text-sm md:text-base font-medium">
                                    <AlertTriangle size={20} />
                                    <span>
                                        {subscription.inGracePeriod
                                            ? 'تنبيه: انتهت الفترة التجريبية. لديك 24 ساعة لترقية حسابك قبل إيقاف الخدمة.'
                                            : 'انتهت الفترة التجريبية. حسابك الآن في وضع القراءة فقط.'}
                                    </span>
                                    <Link
                                        href="/dashboard/subscription"
                                        className="underline hover:text-white/80 font-bold mx-2"
                                    >
                                        ترقية الحساب الآن
                                    </Link>
                                </div>
                            </div>
                        )}
                        {/* Sidebar */}
                        {/* Mobile Overlay */}
                        {isSidebarOpen && (
                            <div
                                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                                onClick={() => setIsSidebarOpen(false)}
                            />
                        )}

                        <div className={`
                        fixed top-0 right-0 h-full z-50 transition-transform duration-300 ease-in-out lg:translate-x-0
                        ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}>
                            <Sidebar user={user} subscription={subscription} onCloseMobile={() => setIsSidebarOpen(false)} />
                        </div>

                        {/* Main Content Area */}
                        <div className="transition-all duration-300 lg:mr-64">
                            {/* Header */}
                            <Header
                                user={user}
                                subscription={subscription}
                                onMenuClick={() => setIsSidebarOpen(true)}
                            />

                            {/* Page Content */}
                            <main className="p-4 lg:p-6">
                                {children}
                            </main>
                        </div>
                    </div>
                </UserProvider>
            </SubscriptionProvider>
        </TourProvider>
    )
}
