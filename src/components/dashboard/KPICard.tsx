import type { ReactNode } from "react"

interface KPICardProps {
    title: string
    value: string | number
    icon: ReactNode
    subValue?: string
    trend?: 'up' | 'down' | 'neutral'
    trendValue?: string
    color?: 'primary' | 'success' | 'warning' | 'danger'
}

export default function KPICard({ title, value, icon, subValue, trend, trendValue, color = 'primary' }: KPICardProps) {
    const colorClasses = {
        primary: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
        success: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
        warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', icon: 'text-yellow-600' },
        danger: { bg: 'bg-red-50', text: 'text-red-700', icon: 'text-red-600' },
    }

    const { bg, text, icon: iconColor } = colorClasses[color] || colorClasses.primary

    return (
        <div className="card transition-all duration-300 hover:shadow-md">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-[var(--text-secondary)] mb-1">
                        {title}
                    </p>
                    <h3 className={`text-2xl font-bold ${text}`}>
                        {value}
                    </h3>
                    {subValue && (
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                            {subValue}
                        </p>
                    )}
                </div>
                <div className={`p-2.5 rounded-lg ${bg} ${iconColor}`}>
                    {icon}
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center text-xs">
                    <span className={`font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {trendValue}
                    </span>
                    <span className="text-[var(--text-secondary)] mr-1">
                        من الشهر الماضي (تجريبي)
                    </span>
                </div>
            )}
        </div>
    )
}
