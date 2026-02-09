import Link from 'next/link'
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import type { SubscriptionState } from '@/lib/subscription'

export default function TrialCountdown({ subscription, compact = false }: { subscription: SubscriptionState, compact?: boolean }) {
    if (subscription.status === 'SUBSCRIBED') return null

    const { daysLeft, isExpired, inGracePeriod } = subscription

    let colorClass = 'bg-emerald-100 text-emerald-800'
    let icon = <Clock size={compact ? 16 : 18} />
    let message = `${daysLeft} يوم متبقي`

    if (isExpired) {
        if (inGracePeriod) {
            colorClass = 'bg-orange-100 text-orange-800'
            icon = <AlertTriangle size={compact ? 16 : 18} />
            message = 'انتهت الفترة (فترة سماح)'
        } else {
            colorClass = 'bg-red-100 text-red-800'
            icon = <AlertTriangle size={compact ? 16 : 18} />
            message = 'انتهت الفترة التجريبية'
        }
    } else if (daysLeft <= 3) {
        colorClass = 'bg-yellow-100 text-yellow-800'
        icon = <Clock size={compact ? 16 : 18} />
    }

    if (compact) {
        return (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colorClass} text-sm font-medium`}>
                {icon}
                <span>{message}</span>
                <Link
                    href="https://wa.me/+966552258852?text=السلام%20عليكم%D8%8C%20أرغب%20في%20ترقية%20اشتراكي%20في%20نظام%20إدارة%20القاعات"
                    target="_blank"
                    className="mr-2 underline hover:text-opacity-80 font-bold"
                >
                    ترقية الآن
                </Link>
            </div>
        )
    }

    return (
        <div className={`mt-4 mx-4 p-3 rounded-lg ${colorClass} text-sm`}>
            <div className="flex items-center gap-2 font-medium mb-1">
                {icon}
                <span>{message}</span>
            </div>
            {!isExpired && daysLeft > 0 && (
                <div className="w-full bg-black/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                        className="bg-current h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(0, Math.min(100, (daysLeft / 7) * 100))}%` }}
                    />
                </div>
            )}
            <Link
                href="https://wa.me/+966552258852?text=السلام%20عليكم%D8%8C%20أرغب%20في%20ترقية%20اشتراكي%20في%20نظام%20إدارة%20القاعات"
                target="_blank"
                className="block mt-2 text-center bg-white/50 hover:bg-white/80 py-1.5 rounded text-xs font-bold transition-colors"
            >
                ترقية الحساب الآن
            </Link>
        </div>
    )
}
