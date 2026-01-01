'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Settings as SettingsIcon,
    Building2,
    Save,
    RefreshCw,
    CheckCircle,
    XCircle,
    Link2
} from 'lucide-react'

interface SettingsData {
    companyNameAr: string
    companyLogo: string | null
    companyPhone: string | null
    companyEmail: string | null
    companyAddress: string | null
    companyAddressLine2: string | null
    commercialRegNo: string | null
    vatRegNo: string | null
    vatPercentage: number
    qoyodEnabled: boolean
    qoyodApiKey: string | null
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [qoyodStatus, setQoyodStatus] = useState<{ connected: boolean; message: string } | null>(null)
    const [testingQoyod, setTestingQoyod] = useState(false)

    const DEFAULT_SETTINGS: SettingsData = {
        companyNameAr: 'نظام إدارة القاعات',
        companyLogo: null,
        companyPhone: null,
        companyEmail: null,
        companyAddress: null,
        companyAddressLine2: null,
        commercialRegNo: null,
        vatRegNo: null,
        vatPercentage: 15,
        qoyodEnabled: false,
        qoyodApiKey: null
    }

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings(data)
                // Cache successful response
                localStorage.setItem('settings_cache', JSON.stringify(data))
            } else {
                console.warn('API returned error, falling back to cache')
                throw new Error('API Error')
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
            // Fallback to cache or defaults
            const cached = localStorage.getItem('settings_cache')
            if (cached) {
                setSettings(JSON.parse(cached))
                setMessage({ type: 'error', text: 'فشل الاتصال بالخادم، تم تحميل البيانات المحفوظة محلياً' })
            } else {
                setSettings(DEFAULT_SETTINGS)
                setMessage({ type: 'error', text: 'فشل الاتصال بالخادم، تم تحميل الإعدادات الافتراضية' })
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSettings()
    }, [])

    const handleSave = async () => {
        if (!settings) return
        setSaving(true)
        setMessage(null)

        try {
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (response.ok) {
                setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح' })
                // Update cache on success
                localStorage.setItem('settings_cache', JSON.stringify(settings))
            } else {
                throw new Error('API Error')
            }
        } catch (error) {
            console.error('Error:', error)
            // Fallback save to local storage
            localStorage.setItem('settings_cache', JSON.stringify(settings))
            setMessage({ type: 'success', text: 'تم حفظ الإعدادات محلياً (فشل الاتصال بالخادم)' })
        } finally {
            setSaving(false)
        }
    }

    const testQoyodConnection = async () => {
        setTestingQoyod(true)
        setQoyodStatus(null)

        try {
            const response = await fetch('/api/qoyod')
            const data = await response.json()
            setQoyodStatus(data)
        } catch (error) {
            console.error('Error:', error)
            setQoyodStatus({ connected: false, message: 'فشل الاتصال' })
        } finally {
            setTestingQoyod(false)
        }
    }

    if (loading || !settings) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-500">جاري التحميل...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        الإعدادات
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إعدادات النظام والتكامل
                    </p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                >
                    <Save size={18} />
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    {message.text}
                </div>
            )}

            {/* Company Information */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 size={20} />
                        معلومات الشركة
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="form-label">اسم الشركة</label>
                            <input
                                type="text"
                                value={settings.companyNameAr}
                                onChange={(e) => setSettings({ ...settings, companyNameAr: e.target.value })}
                                className="form-input w-full"
                            />
                        </div>
                        <div>
                            <label className="form-label">رقم الجوال</label>
                            <input
                                type="tel"
                                value={settings.companyPhone || ''}
                                onChange={(e) => setSettings({ ...settings, companyPhone: e.target.value })}
                                className="form-input w-full"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="form-label">البريد الإلكتروني</label>
                            <input
                                type="email"
                                value={settings.companyEmail || ''}
                                onChange={(e) => setSettings({ ...settings, companyEmail: e.target.value })}
                                className="form-input w-full"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="form-label">رقم السجل التجاري</label>
                            <input
                                type="text"
                                value={settings.commercialRegNo || ''}
                                onChange={(e) => setSettings({ ...settings, commercialRegNo: e.target.value })}
                                className="form-input w-full"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="form-label">الرقم الضريبي</label>
                            <input
                                type="text"
                                value={settings.vatRegNo || ''}
                                onChange={(e) => setSettings({ ...settings, vatRegNo: e.target.value })}
                                className="form-input w-full"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="form-label">نسبة ضريبة القيمة المضافة (%)</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={settings.vatPercentage}
                                onChange={(e) => setSettings({ ...settings, vatPercentage: parseFloat(e.target.value) })}
                                className="form-input w-full"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="form-label">العنوان (السطر الأول)</label>
                        <input
                            type="text"
                            value={settings.companyAddress || ''}
                            onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                            className="form-input w-full"
                            placeholder="مثال: القصيم – رياض الخبراء"
                        />
                    </div>
                    <div>
                        <label className="form-label">العنوان (السطر الثاني)</label>
                        <input
                            type="text"
                            value={settings.companyAddressLine2 || ''}
                            onChange={(e) => setSettings({ ...settings, companyAddressLine2: e.target.value })}
                            className="form-input w-full"
                            placeholder="مثال: طريق الملك عبدالعزيز – مقابل دوار الرس"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Qoyod Integration */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Link2 size={20} />
                        تكامل قيود (Qoyod)
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={settings.qoyodEnabled}
                                onChange={(e) => setSettings({ ...settings, qoyodEnabled: e.target.checked })}
                                className="w-5 h-5 rounded border-gray-300 text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                            />
                            <span className="font-medium">تفعيل التكامل مع قيود</span>
                        </label>
                    </div>

                    {settings.qoyodEnabled && (
                        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <label className="form-label">مفتاح API</label>
                                <input
                                    type="password"
                                    value={settings.qoyodApiKey || ''}
                                    onChange={(e) => setSettings({ ...settings, qoyodApiKey: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="أدخل مفتاح API من قيود"
                                    dir="ltr"
                                />
                                <p className="text-xs text-[var(--text-muted)] mt-1">
                                    يمكنك الحصول على مفتاح API من لوحة تحكم قيود
                                </p>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={testQoyodConnection}
                                    disabled={testingQoyod}
                                    className="btn-secondary flex items-center gap-2"
                                >
                                    <RefreshCw size={16} className={testingQoyod ? 'animate-spin' : ''} />
                                    اختبار الاتصال
                                </button>

                                {qoyodStatus && (
                                    <div className={`flex items-center gap-2 ${qoyodStatus.connected ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {qoyodStatus.connected ? <CheckCircle size={18} /> : <XCircle size={18} />}
                                        <span>{qoyodStatus.message}</span>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-[var(--border-color)] pt-4">
                                <h4 className="font-medium mb-2">ميزات التكامل:</h4>
                                <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                                    <li>• مزامنة الفواتير تلقائياً مع قيود</li>
                                    <li>• مزامنة المدفوعات وسندات القبض</li>
                                    <li>• ربط العملاء بين النظامين</li>
                                    <li>• تقارير محاسبية موحدة</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
