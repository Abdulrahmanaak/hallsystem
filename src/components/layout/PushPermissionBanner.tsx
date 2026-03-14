'use client'

import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function PushPermissionBanner() {
    const { permission, isSupported, requestPermission } = usePushNotifications()
    const [isDismissed, setIsDismissed] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Don't show if unsupported, already granted/denied, or dismissed
    if (!isSupported || permission !== 'default' || isDismissed) {
        return null
    }

    const handleEnable = async () => {
        setIsLoading(true)
        await requestPermission()
        setIsLoading(false)
    }

    return (
        <div className="mx-4 lg:mx-6 mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Bell size={20} className="text-indigo-600" />
            </div>

            <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">
                    هل تريد تلقي إشعارات فورية؟
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                    ستصلك الإشعارات حتى عند إغلاق الموقع
                </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={handleEnable}
                    disabled={isLoading}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                    {isLoading ? 'جارٍ التفعيل...' : 'تفعيل'}
                </button>
                <button
                    onClick={() => setIsDismissed(true)}
                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="إغلاق"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    )
}
