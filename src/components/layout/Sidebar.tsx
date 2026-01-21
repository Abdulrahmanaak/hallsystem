'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Calendar,
    FileText,
    Users,
    User,
    Building2,
    DollarSign,
    UserCog,
    Settings,
    X
} from 'lucide-react'
import type { UserRole } from '@/types/enums'
import HelpMenu from '@/components/tutorial/HelpMenu'

interface SidebarProps {
    user: {
        nameAr: string
        role: UserRole
    }
    onCloseMobile?: () => void
}

interface MenuItem {
    label: string
    icon: React.ReactNode
    href: string
    roles: UserRole[] // Which roles can see this menu item
}

export default function Sidebar({ user, onCloseMobile }: SidebarProps) {
    const pathname = usePathname()

    const menuItems: MenuItem[] = [
        {
            label: 'الرئيسية',
            icon: <LayoutDashboard size={20} />,
            href: '/dashboard',
            roles: ['SUPER_ADMIN', 'HALL_OWNER', 'ROOM_SUPERVISOR', 'ACCOUNTANT', 'EMPLOYEE']
        },
        {
            label: 'التقويم',
            icon: <Calendar size={20} />,
            href: '/dashboard/calendar',
            roles: ['SUPER_ADMIN', 'HALL_OWNER', 'ROOM_SUPERVISOR', 'ACCOUNTANT', 'EMPLOYEE']
        },
        {
            label: 'الحجوزات',
            icon: <FileText size={20} />,
            href: '/dashboard/bookings',
            roles: ['SUPER_ADMIN', 'HALL_OWNER', 'ROOM_SUPERVISOR', 'ACCOUNTANT', 'EMPLOYEE']
        },
        {
            label: 'القاعات',
            icon: <Building2 size={20} />,
            href: '/dashboard/halls',
            roles: ['SUPER_ADMIN', 'HALL_OWNER', 'ROOM_SUPERVISOR']
        },
        {
            label: 'المالية',
            icon: <DollarSign size={20} />,
            href: '/dashboard/finance',
            roles: ['SUPER_ADMIN', 'HALL_OWNER', 'ACCOUNTANT']
        },
        {
            label: 'المصروفات',
            icon: <FileText size={20} />,
            href: '/dashboard/expenses',
            roles: ['SUPER_ADMIN', 'HALL_OWNER', 'ROOM_SUPERVISOR', 'ACCOUNTANT', 'EMPLOYEE']
        },
        {
            label: 'المستخدمين',
            icon: <UserCog size={20} />,
            href: '/dashboard/users',
            roles: ['SUPER_ADMIN', 'HALL_OWNER']
        },
        {
            label: 'الملف الشخصي',
            icon: <User size={20} />,
            href: '/dashboard/profile',
            roles: ['SUPER_ADMIN', 'HALL_OWNER', 'ROOM_SUPERVISOR', 'ACCOUNTANT', 'EMPLOYEE']
        },
        {
            label: 'الإعدادات',
            icon: <Settings size={20} />,
            href: '/dashboard/settings',
            roles: ['SUPER_ADMIN', 'HALL_OWNER']
        }
    ]

    // Filter menu items based on user role
    const visibleMenuItems = menuItems.filter(item =>
        item.roles.includes(user.role)
    )

    return (
        <aside className="sidebar flex flex-col h-full">
            {/* Logo/Brand */}
            <div className="p-6 border-b border-[var(--border-color)]">
                <h2 className="text-xl font-bold text-[var(--primary-700)]">
                    نظام إدارة القاعات
                </h2>
                <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-[var(--text-secondary)]">
                        {user.nameAr}
                    </p>
                    {onCloseMobile && (
                        <button
                            onClick={onCloseMobile}
                            className="lg:hidden p-1 hover:bg-gray-100 rounded-md text-gray-500"
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Menu */}
            <nav id="tour-sidebar-nav" className="p-4 flex-1">
                <ul className="space-y-1">
                    {visibleMenuItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== '/dashboard' && pathname.startsWith(item.href))

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                                >
                                    {item.icon}
                                    <span>{item.label}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* Help Menu at Bottom */}
            <div className="p-4 border-t border-[var(--border-color)]">
                <HelpMenu currentPath={pathname} />
            </div>
        </aside>
    )
}
