'use client'

import { useState, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Lock, ArrowRight, CheckCircle } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    const router = useRouter()

    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    })
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    if (!token) {
        return (
            <div className="text-center p-4 text-red-600">
                رابط غير صالح. يرجى التأكد من الرابط والمحاولة مرة أخرى.
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.password !== formData.confirmPassword) {
            setStatus('error')
            setMessage('كلمتا المرور غير متطابقتين')
            return
        }

        setStatus('loading')

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: formData.password
                })
            })

            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage(data.message)
                setTimeout(() => router.push('/login'), 3000)
            } else {
                setStatus('error')
                setMessage(data.error)
            }
        } catch (error) {
            setStatus('error')
            setMessage('حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.')
        }
    }

    if (status === 'success') {
        return (
            <div className="text-center space-y-4 py-6">
                <div className="text-green-500 flex justify-center">
                    <CheckCircle size={48} />
                </div>
                <h3 className="text-xl font-bold text-green-700">تم تغيير كلمة المرور بنجاح</h3>
                <p className="text-gray-600">سيتم توجيهك إلى صفحة تسجيل الدخول...</p>
                <Link href="/login" className="btn-primary inline-block mt-4">
                    تسجيل الدخول الآن
                </Link>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {status === 'error' && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {message}
                </div>
            )}

            <div>
                <label className="form-label block mb-1">كلمة المرور الجديدة</label>
                <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="form-input w-full pr-10"
                        placeholder="********"
                        dir="ltr"
                    />
                </div>
            </div>

            <div>
                <label className="form-label block mb-1">تأكيد كلمة المرور</label>
                <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="form-input w-full pr-10"
                        placeholder="********"
                        dir="ltr"
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary w-full"
            >
                {status === 'loading' ? 'جاري الحفظ...' : 'حفظ كلمة المرور الجديدة'}
            </button>
        </form>
    )
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl font-bold text-[var(--primary-700)]">
                        تعيين كلمة المرور الجديدة
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <Suspense fallback={<div className="text-center py-8">جاري التحميل...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                    <div className="text-center mt-4">
                        <Link
                            href="/login"
                            className="text-[var(--primary-600)] hover:underline flex items-center justify-center gap-1 text-sm"
                        >
                            <ArrowRight size={16} />
                            العودة لتسجيل الدخول
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
