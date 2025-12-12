'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, User } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const result = await signIn('credentials', {
                username,
                password,
                redirect: false
            })

            if (result?.error) {
                setError(result.error)
            } else if (result?.ok) {
                router.push('/dashboard')
                router.refresh()
            }
        } catch (err) {
            setError('حدث خطأ أثناء تسجيل الدخول')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="login-container">
            <div className="login-card">
                {/* Header */}
                <div className="login-header">
                    <h1 className="login-title">برنامج مناسبات</h1>
                    <p className="login-subtitle">أدخل بياناتك لتسجيل الدخول</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username Field */}
                    <div>
                        <label htmlFor="username" className="form-label">
                            اسم المستخدم
                        </label>
                        <div className="relative">
                            <input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="form-input pl-10"
                                placeholder="أدخل اسم المستخدم"
                                required
                                disabled={isLoading}
                            />
                            <User
                                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                size={20}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="password" className="form-label">
                            كلمة المرور
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="form-input pl-10"
                                placeholder="أدخل كلمة المرور"
                                required
                                disabled={isLoading}
                            />
                            <Lock
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
                        className="btn-primary w-full"
                    >
                        {isLoading ? 'جاري تسجيل الدخول...' : 'دخول'}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>نظام إدارة القاعات والمناسبات</p>
                    <p className="mt-1">v1.0.0</p>
                </div>
            </div>
        </div>
    )
}
