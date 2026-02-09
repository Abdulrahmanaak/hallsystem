'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Bell, Menu } from 'lucide-react'
import type { UserRole } from '@/types/enums'
import type { SubscriptionState } from '@/lib/subscription'
import TrialCountdown from '@/components/dashboard/TrialCountdown'

interface HeaderProps {
    user: {
        nameAr: string
        role: UserRole
    }
    subscription: SubscriptionState
    onMenuClick?: () => void
}

const roleNames: Record<UserRole, string> = {
    SUPER_ADMIN: 'مدير عام',
    HALL_OWNER: 'صاحب قاعة',
    ROOM_SUPERVISOR: 'مشرف القاعات',
    ACCOUNTANT: 'محاسب',
    EMPLOYEE: 'موظف'
}

export default function Header({ user, subscription, onMenuClick }: HeaderProps) {
    return (
        <header className="header">
            {/* Group 1 (Right): Menu + UserProfile */}
            <div className="flex items-center gap-4">
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-md text-gray-600"
                    >
                        <Menu size={24} />
                    </button>
                )}

                {/* User Info - Moved to Start (Right Side) */}
                <div className="flex items-center gap-3 border-l border-[var(--border-color)] pl-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                        <span className="text-[var(--primary-700)] font-semibold">
                            {user.nameAr.charAt(0)}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="font-medium text-[var(--text-primary)]">
                            {user.nameAr}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {roleNames[user.role]}
                        </p>
                    </div>
                </div>
            </div>

            {/* Group 2 (Left): TrialCountdown + Notifications + Logout */}
            <div className="flex items-center gap-4">
                {/* Trial Countdown */}
                <div className="hidden md:block">
                    <TrialCountdown subscription={subscription} compact={true} />
                </div>

                {/* Notifications */}
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
                    <Bell size={20} className="text-gray-600" />
                </button>

                {/* Logout Button */}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-sm"
                >
                    <LogOut size={16} />
                    <span className="hidden md:inline">خروج</span>
                </button>
            </div>
        </header>
    )
}
