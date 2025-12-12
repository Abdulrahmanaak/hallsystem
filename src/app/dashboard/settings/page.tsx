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

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            const data = await response.json()
            setSettings(data)
        } catch (error) {
            console.error('Error fetching settings:', error)
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
            } else {
                setMessage({ type: 'error', text: 'فشل حفظ الإعدادات' })
            }
        } catch (error) {
            console.error('Error:', error)
            setMessage({ type: 'error', text: 'حدث خطأ' })
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
                        <label className="form-label">العنوان</label>
                        <textarea
                            value={settings.companyAddress || ''}
                            onChange={(e) => setSettings({ ...settings, companyAddress: e.target.value })}
                            className="form-input w-full"
                            rows={2}
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

            {/* System Info */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SettingsIcon size={20} />
                        معلومات النظام
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-[var(--text-muted)]">الإصدار:</span>
                            <span className="font-medium mr-2">1.0.0 MVP</span>
                        </div>
                        <div>
                            <span className="text-[var(--text-muted)]">قاعدة البيانات:</span>
                            <span className="font-medium mr-2">SQLite</span>
                        </div>
                        <div>
                            <span className="text-[var(--text-muted)]">الإطار:</span>
                            <span className="font-medium mr-2">Next.js 16</span>
                        </div>
                        <div>
                            <span className="text-[var(--text-muted)]">ORM:</span>
                            <span className="font-medium mr-2">Prisma</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
