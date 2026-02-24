'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Settings as SettingsIcon,
    Building2,
    Save,
    RefreshCw,
    CheckCircle,
    XCircle,
    Link2,
    Eye,
    EyeOff,
    Upload,
    Trash2,
    ImageIcon,
    MapPin,
    Copy
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
    qoyodDefaultBankAccountId: string | null
    qoyodDefaultSalesAccountId: string | null
    qoyodAutoSync: boolean
    // Public Booking Link
    slug?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    ogImage?: string | null
}

interface QoyodAccount {
    id: number
    name_ar: string
    name_en: string
    type: string
}

import { useSubscription } from '@/hooks/useSubscription'

export default function SettingsPage() {
    const { isReadOnly } = useSubscription()
    const [settings, setSettings] = useState<SettingsData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [qoyodStatus, setQoyodStatus] = useState<{ connected: boolean; message: string } | null>(null)
    const [testingQoyod, setTestingQoyod] = useState(false)
    const [showApiKey, setShowApiKey] = useState(false)
    const [qoyodAccounts, setQoyodAccounts] = useState<{ revenue: QoyodAccount[], asset: QoyodAccount[] }>({ revenue: [], asset: [] })
    const [loadingAccounts, setLoadingAccounts] = useState(false)
    const originalSettingsRef = useRef<string | null>(null)
    const [isDirty, setIsDirty] = useState(false)

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
        qoyodApiKey: null,
        qoyodDefaultBankAccountId: null,
        qoyodDefaultSalesAccountId: null,
        qoyodAutoSync: true,
        slug: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null
    }

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/settings')
            if (response.ok) {
                const data = await response.json()
                setSettings(data)
                originalSettingsRef.current = JSON.stringify(data)
                setIsDirty(false)
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

    // Track dirty state by comparing current settings to the original snapshot
    useEffect(() => {
        if (settings && originalSettingsRef.current) {
            const current = JSON.stringify(settings)
            setIsDirty(current !== originalSettingsRef.current)
        }
    }, [settings])

    // Warn user before leaving the page with unsaved changes
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault()
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isDirty])

    const scrollToSave = useCallback(() => {
        document.getElementById('save-settings-btn')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, [])

    const handleSave = async () => {
        if (!settings) return
        if (isReadOnly) {
            alert('عفواً، لا يمكن حفظ التغييرات في وضع القراءة فقط.')
            return
        }
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
                // Update cache and reset dirty state on success
                localStorage.setItem('settings_cache', JSON.stringify(settings))
                originalSettingsRef.current = JSON.stringify(settings)
                setIsDirty(false)
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
        if (!settings) return

        setTestingQoyod(true)
        setQoyodStatus(null)

        try {
            // Save settings first
            const saveResponse = await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })

            if (!saveResponse.ok) {
                throw new Error('Failed to save settings')
            }

            // Then test connection
            const response = await fetch('/api/qoyod')
            const data = await response.json()
            setQoyodStatus(data)

            // If connected, fetch accounts for dropdowns
            if (data.connected) {
                await fetchQoyodAccounts()
            }

            // Update cache
            localStorage.setItem('settings_cache', JSON.stringify(settings))
        } catch (error) {
            console.error('Error:', error)
            setQoyodStatus({ connected: false, message: 'فشل الاتصال' })
        } finally {
            setTestingQoyod(false)
        }
    }

    const fetchQoyodAccounts = async () => {
        setLoadingAccounts(true)
        try {
            const response = await fetch('/api/qoyod?action=accounts')
            const data = await response.json()
            if (data.success) {
                setQoyodAccounts({
                    revenue: data.revenueAccounts || [],
                    asset: data.assetAccounts || []
                })
            }
        } catch (error) {
            console.error('Error fetching Qoyod accounts:', error)
        } finally {
            setLoadingAccounts(false)
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
                    id="save-settings-btn"
                    onClick={handleSave}
                    disabled={saving || isReadOnly}
                    className={`btn-primary flex items-center gap-2 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isReadOnly ? "غير متاح في وضع القراءة فقط" : ""}
                >
                    <Save size={18} />
                    {saving ? 'جاري الحفظ...' : isReadOnly ? "غير متاح" : 'حفظ الإعدادات'}
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
            <Card id="tour-company-info" className="bg-white border border-[var(--border-color)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 size={20} />
                        معلومات الشركة
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Logo Upload Section */}
                    <div className="flex items-start gap-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <div className="flex-shrink-0">
                            {settings.companyLogo ? (
                                <div className="relative">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={settings.companyLogo}
                                        alt="شعار الشركة"
                                        className="w-24 h-24 object-contain rounded-lg border border-gray-200 bg-white p-1"
                                    />
                                    <button
                                        onClick={() => setSettings({ ...settings, companyLogo: null })}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                                        title="حذف الشعار"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-24 h-24 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
                                    <ImageIcon size={32} className="text-gray-400" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <label className="form-label">شعار الشركة</label>
                            <p className="text-sm text-gray-500 mb-2">سيظهر الشعار في الفواتير والعقود المطبوعة</p>
                            <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <Upload size={18} className="text-gray-600" />
                                <span className="text-sm font-medium text-gray-700">رفع صورة</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                            const reader = new FileReader()
                                            reader.onload = (event) => {
                                                setSettings({ ...settings, companyLogo: event.target?.result as string })
                                            }
                                            reader.readAsDataURL(file)
                                        }
                                    }}
                                />
                            </label>
                            <p className="text-xs text-gray-400 mt-2">PNG, JPG أو SVG (حجم أقصى 2MB)</p>
                        </div>
                    </div>

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

            {/* Public Booking Link & SEO */}
            <Card id="tour-public-link" className="bg-white border border-[var(--border-color)]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MapPin size={20} />
                        رابط الحجز العام والمشاركة
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="form-label">الرابط المخصص (Slug)</label>
                            <div className="flex items-center gap-2" dir="ltr">
                                <span className="text-sm text-slate-500 bg-slate-100 p-2 rounded-md border" dir="ltr">hallsystem.codeless.sa/book/</span>
                                <input
                                    type="text"
                                    value={settings.slug || ''}
                                    onChange={(e) => setSettings({ ...settings, slug: e.target.value.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase() })}
                                    className="form-input w-full font-mono text-left"
                                    placeholder="my-business-name"
                                    dir="ltr"
                                />
                                {settings.slug && (
                                    <button
                                        onClick={() => {
                                            const url = `https://hallsystem.codeless.sa/book/${settings.slug}`
                                            navigator.clipboard.writeText(url)
                                                .then(() => alert('تم نسخ الرابط بنجاح'))
                                                .catch(() => alert('فشل نسخ الرابط'))
                                        }}
                                        className="p-2 border rounded-md hover:bg-slate-50 text-slate-600 flex gap-2 items-center"
                                        title="نسخ الرابط"
                                    >
                                        <Copy size={16} /> <span className="text-xs">نسخ</span>
                                    </button>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1">يستخدم لإنشاء رابط حجز عام يضم جميع قاعاتك. يسمح فقط بالأحرف الإنجليزية والأرقام والشرطات (-).</p>
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">عنوان المشاركة (SEO Title)</label>
                            <input
                                type="text"
                                value={settings.ogTitle || ''}
                                onChange={(e) => setSettings({ ...settings, ogTitle: e.target.value })}
                                className="form-input w-full"
                                placeholder="مثال: احجز قاعاتنا لمناسبتك القادمة"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label">وصف المشاركة (SEO Description)</label>
                            <textarea
                                value={settings.ogDescription || ''}
                                onChange={(e) => setSettings({ ...settings, ogDescription: e.target.value })}
                                className="form-input w-full h-20"
                                placeholder="وصف مختصر يظهر عند مشاركة الرابط في وسائل التواصل الاجتماعي"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="form-label mb-2 block">صورة المشاركة (SEO Image)</label>
                            <div className="flex items-start gap-6 p-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                <div className="flex-shrink-0">
                                    {settings.ogImage ? (
                                        <div className="relative">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={settings.ogImage}
                                                alt="صورة المشاركة"
                                                className="w-24 h-24 object-cover rounded-lg border border-gray-200 bg-white p-1"
                                            />
                                            <button
                                                onClick={() => setSettings({ ...settings, ogImage: null })}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md"
                                                title="حذف الصورة"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-24 h-24 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
                                            <ImageIcon size={32} className="text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-500 mb-2">تظهر هذه الصورة عند مشاركة الرابط في وسائل التواصل الاجتماعي</p>
                                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                        <Upload size={18} className="text-gray-600" />
                                        <span className="text-sm font-medium text-gray-700">رفع صورة</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    const reader = new FileReader()
                                                    reader.onload = (event) => {
                                                        setSettings({ ...settings, ogImage: event.target?.result as string })
                                                    }
                                                    reader.readAsDataURL(file)
                                                }
                                            }}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-400 mt-2">PNG, JPG أو SVG (النطاق الأنسب 1200x630)</p>
                                    <p className="text-[10px] text-orange-500 mt-1">إذا تركت فارغة سيتم استخدام شعار الشركة.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Qoyod Integration */}
            <Card id="tour-qoyod-settings" className="bg-white border border-[var(--border-color)]">
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
                                <div className="relative">
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={settings.qoyodApiKey || ''}
                                        onChange={(e) => setSettings({ ...settings, qoyodApiKey: e.target.value })}
                                        className="form-input w-full pl-10"
                                        placeholder="أدخل مفتاح API من قيود"
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
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

                            {/* Account Selection - shown after successful connection */}
                            {qoyodStatus?.connected && (
                                <div className="border-t border-[var(--border-color)] pt-4 space-y-4">
                                    <h4 className="font-medium">إعدادات الحسابات:</h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="form-label">حساب الإيرادات</label>
                                            <select
                                                value={settings.qoyodDefaultSalesAccountId || ''}
                                                onChange={(e) => setSettings({ ...settings, qoyodDefaultSalesAccountId: e.target.value || null })}
                                                className="form-input w-full"
                                                disabled={loadingAccounts}
                                            >
                                                <option value="">اختيار تلقائي</option>
                                                {qoyodAccounts.revenue.map(acc => (
                                                    <option key={acc.id} value={acc.id.toString()}>
                                                        {acc.name_ar || acc.name_en}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                حساب تسجيل إيرادات الفواتير
                                            </p>
                                        </div>
                                        <div>
                                            <label className="form-label">حساب البنك/الصندوق</label>
                                            <select
                                                value={settings.qoyodDefaultBankAccountId || ''}
                                                onChange={(e) => setSettings({ ...settings, qoyodDefaultBankAccountId: e.target.value || null })}
                                                className="form-input w-full"
                                                disabled={loadingAccounts}
                                            >
                                                <option value="">اختيار تلقائي</option>
                                                {qoyodAccounts.asset.map(acc => (
                                                    <option key={acc.id} value={acc.id.toString()}>
                                                        {acc.name_ar || acc.name_en}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-[var(--text-muted)] mt-1">
                                                حساب إيداع المدفوعات
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Auto-sync toggle */}
                            <div className="border-t border-[var(--border-color)] pt-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={settings.qoyodAutoSync}
                                        onChange={(e) => setSettings({ ...settings, qoyodAutoSync: e.target.checked })}
                                        className="w-5 h-5 rounded border-gray-300 text-[var(--primary-600)] focus:ring-[var(--primary-500)]"
                                    />
                                    <span className="font-medium">مزامنة تلقائية عند إنشاء الفواتير والمدفوعات</span>
                                </label>
                                <p className="text-xs text-[var(--text-muted)] mt-1 mr-7">
                                    عند التفعيل، سيتم مزامنة الفواتير والمدفوعات مع قيود تلقائياً
                                </p>
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

            {/* Floating unsaved changes banner */}
            {isDirty && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-4 animate-bounce-once">
                    <span className="font-medium text-sm">⚠️ لديك تغييرات غير محفوظة</span>
                    <button
                        onClick={scrollToSave}
                        className="bg-white text-amber-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-amber-50 transition-colors"
                    >
                        حفظ الآن
                    </button>
                </div>
            )}
        </div>
    )
}
