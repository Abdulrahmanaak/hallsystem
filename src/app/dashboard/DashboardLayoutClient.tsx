'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import type { UserRole } from '@/types/enums'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user: {
        nameAr: string
        role: UserRole
    }
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-[var(--bg-secondary)]">
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
                <Sidebar user={user} onCloseMobile={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main Content Area */}
            <div className="transition-all duration-300 lg:mr-64">
                {/* Header */}
                <Header
                    user={user}
                    onMenuClick={() => setIsSidebarOpen(true)}
                />

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
