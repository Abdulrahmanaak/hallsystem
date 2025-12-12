'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Users,
    Plus,
    Search,
    Phone,
    Mail,
    MapPin,
    Edit2,
    Trash2,
    X,
    User,
    Building
} from 'lucide-react'

interface Customer {
    id: string
    nameAr: string
    phone: string
    email: string | null
    idNumber: string | null
    address: string | null
    customerType: string
    notes: string | null
    bookingsCount: number
    invoicesCount: number
    totalSpent: number
    createdAt: string
}

const CUSTOMER_TYPES: Record<string, string> = {
    'INDIVIDUAL': 'فرد',
    'COMPANY': 'شركة'
}

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
    const [formData, setFormData] = useState({
        nameAr: '',
        phone: '',
        email: '',
        idNumber: '',
        address: '',
        customerType: 'INDIVIDUAL',
        notes: ''
    })
    const [saving, setSaving] = useState(false)

    const fetchCustomers = async () => {
        try {
            const response = await fetch('/api/customers')
            const data = await response.json()
            setCustomers(data)
        } catch (error) {
            console.error('Error fetching customers:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const filteredCustomers = customers.filter(c =>
        c.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const openAddModal = () => {
        setEditingCustomer(null)
        setFormData({
            nameAr: '',
            phone: '',
            email: '',
            idNumber: '',
            address: '',
            customerType: 'INDIVIDUAL',
            notes: ''
        })
        setShowModal(true)
    }

    const openEditModal = (customer: Customer) => {
        setEditingCustomer(customer)
        setFormData({
            nameAr: customer.nameAr,
            phone: customer.phone,
            email: customer.email || '',
            idNumber: customer.idNumber || '',
            address: customer.address || '',
            customerType: customer.customerType,
            notes: customer.notes || ''
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        try {
            const url = editingCustomer
                ? `/api/customers/${editingCustomer.id}`
                : '/api/customers'

            const method = editingCustomer ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    createdById: 'system' // TODO: Get from session
                })
            })

            if (response.ok) {
                setShowModal(false)
                fetchCustomers()
            }
        } catch (error) {
            console.error('Error saving customer:', error)
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا العميل؟')) return

        try {
            const response = await fetch(`/api/customers/${id}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                fetchCustomers()
            }
        } catch (error) {
            console.error('Error deleting customer:', error)
        }
    }

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
                        العملاء
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إدارة بيانات العملاء
                    </p>
                </div>

                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    إضافة عميل
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
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي العملاء</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{customers.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full">
                                <User className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">أفراد</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {customers.filter(c => c.customerType === 'INDIVIDUAL').length}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-full">
                                <Building className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">شركات</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {customers.filter(c => c.customerType === 'COMPANY').length}
                                </p>
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
                            placeholder="بحث بالاسم أو الهاتف أو البريد..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pr-10 w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Customers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCustomers.map(customer => (
                    <Card key={customer.id} className="bg-white border border-[var(--border-color)] hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-12 h-12 rounded-full flex items-center justify-center
                                        ${customer.customerType === 'COMPANY' ? 'bg-purple-100' : 'bg-[var(--primary-50)]'}
                                    `}>
                                        {customer.customerType === 'COMPANY'
                                            ? <Building className="text-purple-600" size={24} />
                                            : <User className="text-[var(--primary-600)]" size={24} />
                                        }
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{customer.nameAr}</CardTitle>
                                        <span className={`
                                            text-xs px-2 py-0.5 rounded-full
                                            ${customer.customerType === 'COMPANY'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-gray-100 text-gray-700'}
                                        `}>
                                            {CUSTOMER_TYPES[customer.customerType]}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditModal(customer)}
                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                    >
                                        <Edit2 size={16} className="text-gray-500" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(customer.id)}
                                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {/* Contact Info */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <Phone size={14} />
                                    <span dir="ltr">{customer.phone}</span>
                                </div>
                                {customer.email && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <Mail size={14} />
                                        <span>{customer.email}</span>
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <MapPin size={14} />
                                        <span>{customer.address}</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="pt-3 border-t border-[var(--border-color)] grid grid-cols-2 gap-2">
                                <div className="text-center">
                                    <p className="text-lg font-bold text-[var(--primary-700)]">{customer.bookingsCount}</p>
                                    <p className="text-xs text-[var(--text-secondary)]">حجز</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-green-600">
                                        {customer.totalSpent.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-[var(--text-secondary)]">ر.س</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredCustomers.length === 0 && (
                <div className="text-center py-12">
                    <Users className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-[var(--text-secondary)]">
                        {searchTerm ? 'لا توجد نتائج للبحث' : 'لا يوجد عملاء بعد'}
                    </p>
                    {!searchTerm && (
                        <button onClick={openAddModal} className="btn-primary mt-4">
                            إضافة أول عميل
                        </button>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">
                                {editingCustomer ? 'تعديل العميل' : 'إضافة عميل جديد'}
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
                                    placeholder="اسم العميل"
                                />
                            </div>

                            <div>
                                <label className="form-label">رقم الجوال *</label>
                                <input
                                    type="tel"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="05xxxxxxxx"
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
                                <label className="form-label">رقم الهوية</label>
                                <input
                                    type="text"
                                    value={formData.idNumber}
                                    onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="رقم الهوية الوطنية أو الإقامة"
                                />
                            </div>

                            <div>
                                <label className="form-label">نوع العميل</label>
                                <select
                                    value={formData.customerType}
                                    onChange={(e) => setFormData({ ...formData, customerType: e.target.value })}
                                    className="form-input w-full"
                                >
                                    <option value="INDIVIDUAL">فرد</option>
                                    <option value="COMPANY">شركة</option>
                                </select>
                            </div>

                            <div>
                                <label className="form-label">العنوان</label>
                                <input
                                    type="text"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="العنوان"
                                />
                            </div>

                            <div>
                                <label className="form-label">ملاحظات</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="form-input w-full"
                                    rows={3}
                                    placeholder="ملاحظات إضافية..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary flex-1"
                                >
                                    {saving ? 'جاري الحفظ...' : (editingCustomer ? 'حفظ التعديلات' : 'إضافة العميل')}
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
        </div>
    )
}
