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

                {/* Temporary Mock Login Buttons */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <p className="text-center text-sm text-[var(--text-secondary)] mb-4">
                        تسجيل دخول سريع (للعرض التجريبي)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setUsername('mock_admin')
                                setPassword('any')
                                signIn('credentials', { username: 'mock_admin', password: 'any', callbackUrl: '/dashboard' })
                            }}
                            className="bg-purple-100 text-purple-700 hover:bg-purple-200 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                            مدير (Admin)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUsername('mock_supervisor')
                                setPassword('any')
                                signIn('credentials', { username: 'mock_supervisor', password: 'any', callbackUrl: '/dashboard' })
                            }}
                            className="bg-blue-100 text-blue-700 hover:bg-blue-200 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                            مشرف (Supervisor)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUsername('mock_accountant')
                                setPassword('any')
                                signIn('credentials', { username: 'mock_accountant', password: 'any', callbackUrl: '/dashboard' })
                            }}
                            className="bg-green-100 text-green-700 hover:bg-green-200 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                            محاسب (Accountant)
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setUsername('mock_employee')
                                setPassword('any')
                                signIn('credentials', { username: 'mock_employee', password: 'any', callbackUrl: '/dashboard' })
                            }}
                            className="bg-gray-100 text-gray-700 hover:bg-gray-200 py-2 px-4 rounded-md text-sm font-medium transition-colors"
                        >
                            موظف (Employee)
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-gray-500">
                    <p>نظام إدارة القاعات والمناسبات</p>
                    <p className="mt-1">v1.0.0</p>
                </div>
            </div>
        </div>
    )
}
