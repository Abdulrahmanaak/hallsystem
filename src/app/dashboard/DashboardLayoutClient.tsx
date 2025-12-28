'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import type { UserRole } from '@/types/enums'
import { Database, CloudOff } from 'lucide-react'

interface DashboardLayoutClientProps {
    children: React.ReactNode
    user: {
        nameAr: string
        role: UserRole
    }
}

export default function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null)
    const [isChecking, setIsChecking] = useState(true)

    // Check database connection status periodically
    useEffect(() => {
        const checkDbStatus = async () => {
            try {
                // Try to fetch halls as a health check
                const response = await fetch('/api/halls', { method: 'HEAD' })
                // If we get any response, API is working
                // The actual DB status is determined by the API route
                setIsDbConnected(response.ok)
            } catch (error) {
                console.error('Health check failed:', error)
                setIsDbConnected(false)
            } finally {
                setIsChecking(false)
            }
        }

        // Check on mount
        checkDbStatus()

        // Check every 60 seconds
        const interval = setInterval(checkDbStatus, 60000)

        return () => clearInterval(interval)
    }, [])

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
                <main className="p-4 lg:p-6 pb-16">
                    {children}
                </main>
            </div>

            {/* Connection Status Indicator */}
            <div className={`
                fixed bottom-0 left-0 right-0 h-10 border-t flex items-center justify-center text-sm z-50
                ${isChecking
                    ? 'bg-gray-100 border-gray-200 text-gray-600'
                    : isDbConnected
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-yellow-100 border-yellow-200 text-yellow-800'
                }
            `}>
                {isChecking ? (
                    <>
                        <span className="animate-pulse">جاري فحص الاتصال...</span>
                    </>
                ) : isDbConnected ? (
                    <>
                        <Database size={16} className="ml-2 text-green-600" />
                        <span>متصل بقاعدة البيانات</span>
                    </>
                ) : (
                    <>
                        <CloudOff size={16} className="ml-2 text-yellow-600" />
                        <span className="font-bold ml-1">وضع العمل المحلي:</span>
                        <span>البيانات محفوظة في المتصفح (localStorage)</span>
                    </>
                )}
            </div>
        </div>
    )
}
