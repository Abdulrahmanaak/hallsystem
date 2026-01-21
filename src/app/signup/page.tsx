'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, User, Lock, Mail, Phone, FileText, Loader2 } from 'lucide-react'

export default function SignupPage() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        companyName: '',
        username: '',
        password: '',
        confirmPassword: '',
        email: '',
        phone: '',
        commercialRegNo: '',
        vatRegNo: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('كلمات المرور غير متطابقة')
            return
        }

        if (formData.password.length < 6) {
            setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nameAr: formData.companyName,
                    username: formData.username,
                    password: formData.password,
                    email: formData.email,
                    phone: formData.phone,
                    commercialRegNo: formData.commercialRegNo || null,
                    vatRegNo: formData.vatRegNo || null
                })
            })

            const data = await response.json()

            if (!response.ok) {
                setError(data.error || 'حدث خطأ أثناء إنشاء الحساب')
                return
            }

            // Success - redirect to login
            router.push('/login?registered=true')
        } catch (err) {
            setError('حدث خطأ في الاتصال بالخادم')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card" style={{ maxWidth: '480px' }}>
                {/* Header */}
                <div className="login-header">
                    <h1 className="login-title">إنشاء حساب جديد</h1>
                    <p className="login-subtitle">سجّل قاعتك وابدأ في إدارة الحجوزات</p>
                </div>

                {/* Signup Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Company Name */}
                    <div>
                        <label htmlFor="companyName" className="form-label">
                            اسم القاعة / المنشأة <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="companyName"
                                name="companyName"
                                type="text"
                                value={formData.companyName}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="مثال: قاعة الفخامة للاحتفالات"
                                required
                                disabled={isLoading}
                            />
                            <Building2
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label htmlFor="username" className="form-label">
                            اسم المستخدم <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                value={formData.username}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="اسم المستخدم للدخول"
                                required
                                disabled={isLoading}
                                dir="ltr"
                            />
                            <User
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label htmlFor="email" className="form-label">
                            البريد الإلكتروني <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="example@domain.com"
                                required
                                disabled={isLoading}
                                dir="ltr"
                            />
                            <Mail
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Phone */}
                    <div>
                        <label htmlFor="phone" className="form-label">
                            رقم الجوال
                        </label>
                        <div className="relative">
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="05xxxxxxxx"

                                disabled={isLoading}
                                dir="ltr"
                            />
                            <Phone
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label htmlFor="password" className="form-label">
                            كلمة المرور <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="6 أحرف على الأقل"
                                required
                                disabled={isLoading}
                            />
                            <Lock
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label htmlFor="confirmPassword" className="form-label">
                            تأكيد كلمة المرور <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="أعد إدخال كلمة المرور"
                                required
                                disabled={isLoading}
                            />
                            <Lock
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Optional Fields Divider */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-500 mb-4">معلومات اختيارية (يمكن إضافتها لاحقاً)</p>
                    </div>

                    {/* Commercial Registration */}
                    <div>
                        <label htmlFor="commercialRegNo" className="form-label">
                            رقم السجل التجاري
                        </label>
                        <div className="relative">
                            <input
                                id="commercialRegNo"
                                name="commercialRegNo"
                                type="text"
                                value={formData.commercialRegNo}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="اختياري"
                                disabled={isLoading}
                                dir="ltr"
                            />
                            <FileText
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* VAT Registration */}
                    <div>
                        <label htmlFor="vatRegNo" className="form-label">
                            رقم التسجيل الضريبي
                        </label>
                        <div className="relative">
                            <input
                                id="vatRegNo"
                                name="vatRegNo"
                                type="text"
                                value={formData.vatRegNo}
                                onChange={handleChange}
                                className="form-input pl-10"
                                placeholder="اختياري"
                                disabled={isLoading}
                                dir="ltr"
                            />
                            <FileText
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                جاري إنشاء الحساب...
                            </>
                        ) : (
                            'إنشاء الحساب'
                        )}
                    </button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        لديك حساب بالفعل؟{' '}
                        <Link href="/login" className="text-[var(--primary)] hover:underline font-medium">
                            تسجيل الدخول
                        </Link>
                    </p>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>نظام إدارة القاعات والمناسبات</p>
                </div>
            </div>
        </div>
    )
}
