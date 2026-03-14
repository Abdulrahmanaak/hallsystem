'use client'

import { useState, useEffect } from 'react'
import { Bell, Smartphone, Mail, Loader2, Save, Send, AlertCircle } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface Prefs {
    inApp: boolean
    push: boolean
    email: boolean
}

export default function NotificationSettings() {
    const { permission, requestPermission } = usePushNotifications()
    const [prefs, setPrefs] = useState<Prefs | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        fetch('/api/users/preferences')
            .then(res => res.json())
            .then(data => {
                setPrefs(data)
                setIsLoading(false)
            })
            .catch(err => {
                console.error('Failed to fetch prefs', err)
                setIsLoading(false)
            })
    }, [])

    const handleToggle = (key: keyof Prefs) => {
        if (!prefs) return
        setPrefs({ ...prefs, [key]: !prefs[key] })
    }

    const handleSave = async () => {
        if (!prefs) return
        setIsSaving(true)
        setMessage(null)

        try {
            const res = await fetch('/api/users/preferences', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(prefs)
            })

            if (res.ok) {
                setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' })
                setTimeout(() => setMessage(null), 3000)
            } else {
                setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'فشل الاتصال بالخادم' })
        } finally {
            setIsSaving(false)
        }
    }

    const handleTest = async () => {
        setIsTesting(true)
        setMessage(null)

        try {
            const res = await fetch('/api/notifications/test', { method: 'POST' })
            if (res.ok) {
                setMessage({ type: 'success', text: 'تم إرسال إشعار تجريبي بنجاح' })
                setTimeout(() => setMessage(null), 5000)
            } else {
                setMessage({ type: 'error', text: 'فشل إرسال الإشعار التجريبي' })
            }
        } catch (err) {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء المحاولة' })
        } finally {
            setIsTesting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 size={24} className="animate-spin text-indigo-500" />
            </div>
        )
    }

    if (!prefs) return null

    const pushBlocked = permission === 'denied' && prefs.push

    return (
        <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 mt-2 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    إعدادات الإشعارات
                </h2>

                <button
                    onClick={handleTest}
                    disabled={isTesting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-50 transition-colors border border-indigo-100 shadow-sm disabled:opacity-50"
                    title="أرسل إشعاراً لتجربة الإعدادات"
                >
                    {isTesting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    تجربة النظام
                </button>
            </div>

            <div className="space-y-4">
                {/* In-App */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                            <Bell size={16} className="text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">إشعارات داخل النظام</p>
                            <p className="text-xs text-gray-500">مشاهدة التنبيهات في أيقونة الجرس</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggle('inApp')}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${prefs.inApp ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all left-1 ${prefs.inApp ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                    </button>
                </div>

                {/* Web Push */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                                <Smartphone size={16} className="text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-800">إشعارات المتصفح (Push)</p>
                                <p className="text-xs text-gray-500">تلقي تنبيهات من المتصفح حتى لو كان الموقع مغلقاً</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                if (!prefs.push && permission === 'default') {
                                    await requestPermission()
                                }
                                handleToggle('push')
                            }}
                            className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${prefs.push ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all left-1 ${prefs.push ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                        </button>
                    </div>

                    {pushBlocked && (
                        <div className="mr-11 flex items-start gap-2 p-2 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-700">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <p>
                                الإشعارات محظورة في متصفحك. يرجى تفعيلها من إعدادات الموقع لتلقي تنبيهات الـ (Push).
                            </p>
                        </div>
                    )}
                </div>

                {/* Email */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                            <Mail size={16} className="text-indigo-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-800">رسائل البريد الإلكتروني</p>
                            <p className="text-xs text-gray-500">تلقي ملخصات وتنبيهات هامة عبر البريد</p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleToggle('email')}
                        className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${prefs.email ? 'bg-indigo-600' : 'bg-gray-300'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all left-1 ${prefs.email ? 'translate-x-5' : 'translate-x-0'} shadow-sm`} />
                    </button>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
                {message && (
                    <p className={`text-xs ${message.type === 'success' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}`}>
                        {message.text}
                    </p>
                )}
                {!message && <div />}
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    حفظ التغييرات
                </button>
            </div>
        </div>
    )
}
