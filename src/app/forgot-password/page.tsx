'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Mail, ArrowRight, AlertTriangle } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setStatus('loading')

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            })

            const data = await response.json()

            if (response.ok) {
                setStatus('success')
                setMessage(data.message)
            } else {
                setStatus('error')
                setMessage(data.error)
            }
        } catch (error) {
            setStatus('error')
            setMessage('حدث خطأ في الاتصال. يرجى المحاولة لاحقاً.')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl font-bold text-[var(--primary-700)]">
                        استعادة كلمة المرور
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                    {status === 'success' ? (
                        <div className="text-center space-y-4">
                            <div className="p-4 bg-green-50 text-green-700 rounded-lg">
                                <p>{message}</p>
                            </div>
                            <Link
                                href="/login"
                                className="btn-primary w-full block text-center"
                            >
                                العودة لتسجيل الدخول
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="bg-yellow-50 p-3 rounded-md flex gap-2 text-sm text-yellow-800">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                <p>هذه الخدمة متاحة فقط لأصحاب القاعات. إذا كنت موظفاً، يرجى التواصل مع الإدارة لإعادة تعيين كلمة المرور.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {status === 'error' && (
                                    <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                                        {message}
                                    </div>
                                )}

                                <div>
                                    <label className="form-label block mb-1">البريد الإلكتروني</label>
                                    <div className="relative">
                                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="form-input w-full pr-10"
                                            placeholder="email@example.com"
                                            dir="ltr"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={status === 'loading'}
                                    className="btn-primary w-full"
                                >
                                    {status === 'loading' ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                                </button>
                            </form>

                            <div className="text-center mt-4">
                                <Link
                                    href="/login"
                                    className="text-[var(--primary-600)] hover:underline flex items-center justify-center gap-1 text-sm"
                                >
                                    <ArrowRight size={16} />
                                    العودة لتسجيل الدخول
                                </Link>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
