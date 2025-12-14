'use client'

import { signOut } from 'next-auth/react'
import { LogOut, Bell, Menu } from 'lucide-react'
import type { UserRole } from '@/types/enums'

interface HeaderProps {
    user: {
        nameAr: string
        role: UserRole
    }
    onMenuClick?: () => void
}

const roleNames: Record<UserRole, string> = {
    ADMIN: 'مدير النظام',
    ROOM_SUPERVISOR: 'مشرف القاعات',
    ACCOUNTANT: 'محاسب',
    EMPLOYEE: 'موظف'
}

export default function Header({ user, onMenuClick }: HeaderProps) {
    return (
        <header className="header">
            <div className="flex items-center gap-4">
                {onMenuClick && (
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-2 hover:bg-gray-100 rounded-md text-gray-600"
                    >
                        <Menu size={24} />
                    </button>
                )}
                {/* Page will add title here if needed */}
            </div>

            <div className="flex items-center gap-4">
                {/* Notifications */}
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Bell size={20} className="text-gray-600" />
                </button>

                {/* User Info */}
                <div className="flex items-center gap-3 border-r border-[var(--border-color)] pr-4">
                    <div className="text-right">
                        <p className="font-medium text-[var(--text-primary)]">
                            {user.nameAr}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                            {roleNames[user.role]}
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-[var(--primary-100)] flex items-center justify-center">
                        <span className="text-[var(--primary-700)] font-semibold">
                            {user.nameAr.charAt(0)}
                        </span>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                    <LogOut size={18} />
                    <span>خروج</span>
                </button>
            </div>
        </header>
    )
}
