import type { BookingStatus } from "@/lib/services/booking"
import { cn } from "@/lib/utils"

const statusStyles: Record<BookingStatus, string> = {
    TENTATIVE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    CHECKED_IN: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    COMPLETED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
}

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
    return (
        <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            statusStyles[status]
        )}>
            {status.replace('_', ' ')}
        </span>
    )
}
