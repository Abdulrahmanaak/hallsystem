'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Users,
    Plus,
    Search,
    Edit2,
    Trash2,
    X,
    Shield,
    UserCheck,
    UserX
} from 'lucide-react'

interface User {
    id: string
    username: string
    nameAr: string
    email: string | null
    phone: string | null
    role: string
    status: string
    lastLogin: string | null
    createdAt: string
    // Subscription fields
    trialEndsAt: string | null
    subscriptionEndsAt: string | null
    subscriptionStatus: string
}

// All roles for display purposes
const ROLES: Record<string, string> = {
    'SUPER_ADMIN': 'مدير عام',
    'HALL_OWNER': 'صاحب قاعة',
    'ROOM_SUPERVISOR': 'مشرف القاعات',
    'ACCOUNTANT': 'محاسب',
    'EMPLOYEE': 'موظف'
}

// Roles available for creation by HALL_OWNER (team members only)
const TEAM_ROLES: Record<string, string> = {
    'ROOM_SUPERVISOR': 'مشرف القاعات',
    'ACCOUNTANT': 'محاسب',
    'EMPLOYEE': 'موظف'
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    'ACTIVE': { label: 'نشط', color: 'bg-green-100 text-green-800' },
    'INACTIVE': { label: 'غير نشط', color: 'bg-red-100 text-red-800' }
}

const SUB_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    'TRIAL': { label: 'تجريبي', color: 'bg-yellow-100 text-yellow-800' },
    'SUBSCRIBED': { label: 'مشترك', color: 'bg-emerald-100 text-emerald-800' },
    'EXPIRED': { label: 'منتهي', color: 'bg-red-100 text-red-800' },
    'CANCELLED': { label: 'ملغي', color: 'bg-gray-100 text-gray-800' },
    'GRACE_PERIOD': { label: 'فترة سماح', color: 'bg-orange-100 text-orange-800' }
}

import { useSubscription } from '@/hooks/useSubscription'
import { useUser } from '@/providers/UserProvider'

export default function UsersPage() {
    const { isReadOnly } = useSubscription()
    const currentUser = useUser()
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Add/Edit User Modal
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        nameAr: '',
        email: '',
        phone: '',
        role: 'EMPLOYEE',
        status: 'ACTIVE'
    })

    // Subscription Management Modal
    const [showSubModal, setShowSubModal] = useState(false)
    const [subUser, setSubUser] = useState<User | null>(null)
    const [subFormData, setSubFormData] = useState({
        action: 'EXTEND_TRIAL', // EXTEND_TRIAL, SET_YEARLY, CANCEL
        days: 7 // Default extension days
    })
    const [saving, setSaving] = useState(false)

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users')
            const data = await response.json()
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const filteredUsers = users.filter(u =>
        u.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const openAddModal = () => {
        if (isReadOnly) {
            alert('عفواً، حسابك في وضع القراءة فقط. يرجى تجديد الاشتراك لإضافة مستخدمين.')
            return
        }
        setEditingUser(null)
        setFormData({
            username: '',
            password: '',
            nameAr: '',
            email: '',
            phone: '',
            role: 'EMPLOYEE',
            status: 'ACTIVE'
        })
        setShowModal(true)
    }

    const openEditModal = (user: User) => {
        if (isReadOnly) {
            alert('عفواً، لا يمكن تعديل البيانات في وضع القراءة فقط.')
            return
        }
        setEditingUser(user)
        setFormData({
            username: user.username,
            password: '',
            nameAr: user.nameAr,
            email: user.email || '',
            phone: user.phone || '',
            role: user.role,
            status: user.status
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = editingUser
                ? `/api/users/${editingUser.id}`
                : '/api/users'

            const method = editingUser ? 'PUT' : 'POST'

            const payload = { ...formData }
            if (editingUser && !formData.password) {
                delete (payload as Record<string, unknown>).password
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                setShowModal(false)
                fetchUsers()
            } else {
                const error = await response.json()
                alert(error.error || 'حدث خطأ')
            }


        } catch (error) {
            console.error('Error saving user:', error)
        } finally {
            setSaving(false)
        }
    }

    const openSubModal = (user: User) => {
        if (currentUser?.role !== 'SUPER_ADMIN') {
            alert('عفواً، هذه الخاصية للمدير العام فقط')
            return
        }
        setSubUser(user)
        setSubFormData({
            action: 'EXTEND_TRIAL',
            days: 7
        })
        setShowSubModal(true)
    }

    const handleSubSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!subUser) return
        setSaving(true)

        try {
            const response = await fetch(`/api/users/${subUser.id}/subscription`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subFormData)
            })

            if (response.ok) {
                setShowSubModal(false)
                fetchUsers()
                alert('تم تحديث حالة الاشتراك بنجاح')
            } else {
                const error = await response.json()
                alert(error.error || 'حدث خطأ')
            }
        } catch (error) {
            console.error('Error updating subscription:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDeactivate = async (id: string) => {
        if (isReadOnly) {
            alert('عفواً، لا يمكن تعديل البيانات في وضع القراءة فقط.')
            return
        }
        if (!confirm('هل أنت متأكد من إلغاء تفعيل هذا المستخدم؟')) return

        try {
            const response = await fetch(`/api/users/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchUsers()
            }
        } catch (error) {
            console.error('Error deactivating user:', error)
        }
    }

    // Stats
    const activeUsers = users.filter(u => u.status === 'ACTIVE').length
    const ownerCount = users.filter(u => u.role === 'HALL_OWNER').length

    if (loading) {
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
                        المستخدمين
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إدارة مستخدمي النظام
                    </p>
                </div>

                <button id="add-user-btn" onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    إضافة مستخدم
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-50)] rounded-full">
                                <Users className="text-[var(--primary-600)]" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي المستخدمين</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{users.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full">
                                <UserCheck className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">مستخدمين نشطين</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{activeUsers}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-full">
                                <Shield className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">مديرين</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{ownerCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="py-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو اسم المستخدم أو البريد..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pr-10 w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="p-0">
                    <div id="tour-users-table" className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>الاسم</th>
                                    <th>اسم المستخدم</th>
                                    <th>الدور</th>
                                    <th>حالة الحساب</th>
                                    <th>الاشتراك</th>
                                    <th>الأيام المتبقية</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td className="font-medium">
                                            <div>{user.nameAr}</div>
                                            <div className="text-xs text-[var(--text-secondary)]">{user.email || '-'}</div>
                                        </td>
                                        <td className="text-[var(--text-secondary)]">{user.username}</td>
                                        <td>
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--primary-50)] text-[var(--primary-700)] rounded-full text-xs font-medium">
                                                <Shield size={12} />
                                                {ROLES[user.role] || user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`
                                                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                                ${STATUS_CONFIG[user.status]?.color || 'bg-gray-100 text-gray-700'}
                                            `}>
                                                {user.status === 'ACTIVE' ? <UserCheck size={12} /> : <UserX size={12} />}
                                                {STATUS_CONFIG[user.status]?.label || user.status}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`
                                                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                                ${SUB_STATUS_CONFIG[user.subscriptionStatus]?.color || 'bg-gray-100 text-gray-700'}
                                            `}>
                                                {SUB_STATUS_CONFIG[user.subscriptionStatus]?.label || user.subscriptionStatus}
                                            </span>
                                        </td>
                                        <td className="font-bold">
                                            {(() => {
                                                if (user.role === 'SUPER_ADMIN') return '∞'

                                                const endDate = user.subscriptionStatus === 'SUBSCRIBED' && user.subscriptionEndsAt
                                                    ? new Date(user.subscriptionEndsAt)
                                                    : (user.trialEndsAt ? new Date(user.trialEndsAt) : null)

                                                if (!endDate) return '-'

                                                const days = Math.ceil((endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                                                return <span className={days < 0 ? 'text-red-500' : (days < 3 ? 'text-orange-500' : 'text-green-600')}>
                                                    {days > 0 ? days : 0}
                                                </span>
                                            })()}
                                        </td>
                                        <td>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 hover:bg-gray-100 rounded-md"
                                                    title="تعديل"
                                                >
                                                    <Edit2 size={16} className="text-gray-500" />
                                                </button>
                                                {/* Only Show Subscription Action for Owners, and only accessible by SUPER_ADMIN */}
                                                {user.role === 'HALL_OWNER' && currentUser.role === 'SUPER_ADMIN' && (
                                                    <button
                                                        onClick={() => openSubModal(user)}
                                                        className="p-2 hover:bg-blue-50 rounded-md"
                                                        title="إدارة الاشتراك"
                                                    >
                                                        <Shield size={16} className="text-blue-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredUsers.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="mx-auto text-gray-300 mb-4" size={64} />
                            <p className="text-[var(--text-secondary)]">
                                {searchTerm ? 'لا توجد نتائج' : 'لا يوجد مستخدمين'}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">
                                {editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="form-label">الاسم *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nameAr}
                                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="الاسم الكامل"
                                />
                            </div>

                            <div>
                                <label className="form-label">اسم المستخدم *</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!!editingUser}
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="اسم المستخدم للدخول"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="form-label">
                                    كلمة المرور {editingUser ? '(اتركها فارغة للإبقاء على الحالية)' : '*'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="كلمة المرور"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="form-label">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="email@example.com"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="form-label">رقم الجوال</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="05xxxxxxxx"
                                    dir="ltr"
                                />
                            </div>

                            <div>
                                <label className="form-label">الدور *</label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    className="form-input w-full"
                                >
                                    {Object.entries(TEAM_ROLES).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="form-label">الحالة</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="form-input w-full"
                                >
                                    <option value="ACTIVE">نشط</option>
                                    <option value="INACTIVE">غير نشط</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary flex-1"
                                >
                                    {saving ? 'جاري الحفظ...' : (editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Subscription Management Modal */}
            {showSubModal && subUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">
                                إدارة اشتراك: {subUser.nameAr}
                            </h3>
                            <button
                                onClick={() => setShowSubModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="form-label">الإجراء</label>
                                <select
                                    value={subFormData.action}
                                    onChange={(e) => setSubFormData({ ...subFormData, action: e.target.value })}
                                    className="form-input w-full"
                                >
                                    <option value="EXTEND_TRIAL">تمديد الفترة التجريبية</option>
                                    <option value="SET_YEARLY">تفعيل اشتراك سنوي</option>
                                    <option value="CANCEL">إلغاء الاشتراك</option>
                                </select>
                            </div>

                            {subFormData.action === 'EXTEND_TRIAL' && (
                                <div>
                                    <label className="form-label">عدد الأيام</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={subFormData.days}
                                        onChange={(e) => setSubFormData({ ...subFormData, days: parseInt(e.target.value) })}
                                        className="form-input w-full"
                                    />
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary flex-1"
                                >
                                    {saving ? 'جاري الحفظ...' : 'تحديث الاشتراك'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowSubModal(false)}
                                    className="btn-secondary flex-1"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
