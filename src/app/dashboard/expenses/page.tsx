'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    DollarSign,
    FileText,
    Plus,
    Search,
    Eye,
    X,
    Image as ImageIcon,
    Calendar,
    Loader2,
    Trash2,
    RefreshCw,
    CheckCircle2,
    Pencil,
    Ban
} from 'lucide-react'

interface Expense {
    id: string
    amount: number
    description: string
    expenseDate: string
    category: string | null
    imageUrl: string | null
    syncedToQoyod: boolean
    isDeleted: boolean
    deletedAt: string | null
    vendor?: {
        id: string
        nameAr: string
        qoyodVendorId?: string | null
    } | null
    createdBy: {
        nameAr: string
        username: string
    }
}

interface Vendor {
    id: string
    nameAr: string
    qoyodVendorId?: string | null
}

import { useSubscription } from '@/hooks/useSubscription'

export default function ExpensesPage() {
    const { isReadOnly } = useSubscription()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [vendors, setVendors] = useState<Vendor[]>([])
    const [loading, setLoading] = useState(true)
    const [syncingVendors, setSyncingVendors] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [vendorSearch, setVendorSearch] = useState('')
    const [showVendorDropdown, setShowVendorDropdown] = useState(false)

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [viewImage, setViewImage] = useState<string | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    // Form data
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        category: '',
        vendorId: '',
        file: null as File | null,
        existingImageUrl: null as string | null
    })
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchData = async () => {
        try {
            const res = await fetch('/api/expenses')
            const data = await res.json()
            setExpenses(data)
        } catch (error) {
            console.error('Error fetching expenses:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors')
            const data = await res.json()
            if (Array.isArray(data)) setVendors(data)
        } catch (error) {
            console.error('Error fetching vendors:', error)
        }
    }

    const syncVendors = async () => {
        setSyncingVendors(true)
        try {
            const res = await fetch('/api/vendors/sync', { method: 'POST' })
            const data = await res.json()
            if (res.ok) {
                alert(data.message || 'تم مزامنة الموردين')
                fetchVendors()
            } else {
                alert(data.error || 'فشل مزامنة الموردين')
            }
        } catch (error) {
            console.error('Error syncing vendors:', error)
            alert('حدث خطأ في مزامنة الموردين')
        } finally {
            setSyncingVendors(false)
        }
    }

    useEffect(() => {
        fetchData()
        fetchVendors()
    }, [])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            // 10MB limit
            if (file.size > 10 * 1024 * 1024) {
                alert('عفواً، حجم الملف يجب أن يكون أقل من 10 ميجابايت')
                e.target.value = ''
                return
            }
            setFormData({ ...formData, file })
        }
    }

    const startAdd = () => {
        setIsEditing(false)
        setEditId(null)
        setFormData({
            amount: '',
            description: '',
            expenseDate: new Date().toISOString().split('T')[0],
            category: '',
            vendorId: '',
            file: null,
            existingImageUrl: null
        })
        setVendorSearch('')
        setShowModal(true)
    }

    const startEdit = (expense: Expense) => {
        setIsEditing(true)
        setEditId(expense.id)
        setFormData({
            amount: expense.amount.toString(),
            description: expense.description,
            expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
            category: expense.category || '',
            vendorId: expense.vendor?.id || '',
            file: null,
            existingImageUrl: expense.imageUrl
        })
        setVendorSearch(expense.vendor?.nameAr || '')
        setShowModal(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المصروف؟ سيتم حذفه من قيود أيضاً إذا كان مرتبطاً.')) return

        setDeletingId(id)
        try {
            const res = await fetch(`/api/expenses/${id}`, {
                method: 'DELETE'
            })

            if (res.ok) {
                const data = await res.json()
                if (data.qoyodDeleted) {
                    alert('تم حذف المصروف محلياً ومن قيود بنجاح')
                } else {
                    alert('تم حذف المصروف بنجاح')
                }
                fetchData()
            } else {
                const data = await res.json()
                alert(data.error || 'فشل حذف المصروف')
            }
        } catch (error) {
            console.error('Error deleting expense:', error)
            alert('حدث خطأ أثناء الحذف')
        } finally {
            setDeletingId(null)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isReadOnly) {
            alert('عفواً، لا يمكن تعديل البيانات في وضع القراءة فقط.')
            return
        }
        setSaving(true)

        try {
            let imageUrl = formData.existingImageUrl

            // 1. Handle Vendor Creation if new
            let finalVendorId = formData.vendorId

            if (!finalVendorId && vendorSearch.trim()) {
                // User typed a name but selected no existing vendor
                // Create new vendor
                try {
                    const vendorRes = await fetch('/api/vendors', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nameAr: vendorSearch.trim() })
                    })

                    if (!vendorRes.ok) {
                        const err = await vendorRes.json()
                        throw new Error(err.error || 'فشل إنشاء المورد الجديد')
                    }

                    const newVendor = await vendorRes.json()
                    finalVendorId = newVendor.id

                    // Refresh vendors list silently
                    fetchVendors()
                } catch (error: unknown) {
                    const errorMessage = error instanceof Error ? error.message : String(error)
                    alert(`خطأ: ${errorMessage}`)
                    setSaving(false)
                    return
                }
            }

            // 2. Upload file if exists
            if (formData.file) {
                const uploadFormData = new FormData()
                uploadFormData.append('file', formData.file)

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData
                })

                if (!uploadRes.ok) {
                    const err = await uploadRes.json()
                    throw new Error(err.error || 'Upload failed')
                }

                const uploadData = await uploadRes.json()
                imageUrl = uploadData.url
            }

            // 2. Create or Update expense
            const url = isEditing && editId ? `/api/expenses/${editId}` : '/api/expenses'
            const method = isEditing ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    expenseDate: formData.expenseDate,
                    category: formData.category,
                    vendorId: finalVendorId || null,
                    imageUrl
                })
            })

            const data = await res.json()

            if (res.ok) {
                setShowModal(false)
                fetchData()
                if (isEditing) {
                    // Check if it was synced, maybe show a toast that Qoyod was updated?
                    // For now silent update is fine as per requirements (just work)
                }
            } else {
                alert(data.error || 'حدث خطأ غير متوقع')
            }
        } catch (error: unknown) {
            console.error('Error saving expense:', error)
            const errorMessage = error instanceof Error ? error.message : String(error)
            alert(errorMessage || 'حدث خطأ أثناء حفظ المصروف')
        } finally {
            setSaving(false)
        }
    }

    const filteredExpenses = expenses.filter(e =>
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.category && e.category.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    // Calculate totals excluding deleted expenses
    const totalStats = {
        count: expenses.filter(e => !e.isDeleted).length,
        amount: expenses
            .filter(e => !e.isDeleted)
            .reduce((sum, e) => sum + Number(e.amount), 0)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-gray-500" size={32} />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        المصروفات
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إدارة المصروفات والفواتير
                    </p>
                </div>

                <button
                    id="tour-add-expense-btn"
                    onClick={startAdd}
                    disabled={isReadOnly}
                    className={`btn-primary flex items-center gap-2 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isReadOnly ? "غير متاح في وضع القراءة فقط" : ""}
                >
                    <Plus size={18} />
                    تسجيل مصروف
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-50)] rounded-full">
                                <FileText className="text-[var(--primary-600)]" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">عدد المصروفات الفعالة</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalStats.count}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-50 rounded-full">
                                <DollarSign className="text-red-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي المصروفات الفعالة</p>
                                <p className="text-2xl font-bold text-red-600">{totalStats.amount.toLocaleString()} ر.س</p>
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
                            placeholder="بحث في المصروفات..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pr-10 w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* List */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>التاريخ</th>
                                    <th>البيان</th>
                                    <th>التصنيف</th>
                                    <th>المبلغ</th>
                                    <th>الحالة</th>
                                    <th>سجل بواسطة</th>
                                    <th>المورد</th>
                                    <th>المرفقات</th>
                                    <th>قيود</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpenses.map(expense => (
                                    <tr key={expense.id}>
                                        <td>{new Date(expense.expenseDate).toLocaleDateString('ar-SA')}</td>
                                        <td className="font-medium">
                                            {expense.description}
                                        </td>
                                        <td>
                                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                                {expense.category || 'عام'}
                                            </span>
                                        </td>
                                        <td className="font-bold text-red-600">
                                            {Number(expense.amount).toLocaleString()} ر.س
                                        </td>
                                        <td>
                                            {expense.isDeleted ? (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                    محذوف
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                    نشط
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-sm text-gray-500">{expense.createdBy.nameAr}</td>
                                        <td className="text-sm">{expense.vendor?.nameAr || '-'}</td>
                                        <td>
                                            {expense.imageUrl && (
                                                <button
                                                    onClick={() => {
                                                        if (expense.imageUrl?.endsWith('.pdf')) {
                                                            window.open(expense.imageUrl, '_blank')
                                                        } else {
                                                            setViewImage(expense.imageUrl)
                                                        }
                                                    }}
                                                    className="text-[var(--primary-600)] hover:underline flex items-center gap-1"
                                                >
                                                    <ImageIcon size={16} />
                                                    <span>عرض</span>
                                                </button>
                                            )}
                                        </td>
                                        <td>
                                            {!expense.isDeleted && (
                                                expense.syncedToQoyod ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm">
                                                        <CheckCircle2 size={16} />
                                                        <span>مربوط</span>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                const res = await fetch('/api/qoyod', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ type: 'expense', id: expense.id })
                                                                })
                                                                const data = await res.json()
                                                                if (res.ok) {
                                                                    alert('تم مزامنة المصروف مع قيود بنجاح')
                                                                    fetchData()
                                                                } else {
                                                                    alert(data.error || 'فشل المزامنة')
                                                                }
                                                            } catch { alert('حدث خطأ في الاتصال') }
                                                        }}
                                                        className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1 text-sm border border-blue-200"
                                                        title="مزامنة مع قيود"
                                                    >
                                                        <RefreshCw size={14} />
                                                        <span>ربط</span>
                                                    </button>
                                                )
                                            )}
                                        </td>
                                        <td>
                                            {!expense.isDeleted ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => startEdit(expense)}
                                                        className="p-1 text-gray-600 hover:text-[var(--primary-600)] hover:bg-gray-100 rounded-md transition-colors"
                                                        title="تعديل"
                                                        disabled={isReadOnly}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        disabled={deletingId === expense.id || isReadOnly}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        title="حذف"
                                                    >
                                                        {deletingId === expense.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 flex justify-center">
                                                    <Ban size={16} />
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredExpenses.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <FileText className="text-gray-300 mb-4" size={64} />
                            <p className="text-[var(--text-secondary)]">لا توجد مصروفات</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                            <h3 className="text-lg font-bold">
                                {isEditing ? 'تعديل المصروف' : 'تسجيل مصروف جديد'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="form-label">المبلغ *</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="form-label mb-0">المورد</label>
                                    <button
                                        type="button"
                                        onClick={syncVendors}
                                        disabled={syncingVendors}
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {syncingVendors ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                        مزامنة من قيود
                                    </button>
                                </div>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="ابحث عن المورد..."
                                        value={vendorSearch}
                                        onChange={e => {
                                            setVendorSearch(e.target.value)
                                            setShowVendorDropdown(true)
                                            setFormData({ ...formData, vendorId: '' }) // Clear ID if typing new
                                        }}
                                        onFocus={() => setShowVendorDropdown(true)}
                                        onBlur={() => setTimeout(() => setShowVendorDropdown(false), 150)}
                                        className="form-input w-full"
                                    />
                                    {showVendorDropdown && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {vendors
                                                .filter(v => v.nameAr.toLowerCase().includes(vendorSearch.toLowerCase()))
                                                .map(v => (
                                                    <div
                                                        key={v.id}
                                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                                                        onClick={() => {
                                                            setFormData({ ...formData, vendorId: v.id })
                                                            setVendorSearch(v.nameAr)
                                                            setShowVendorDropdown(false)
                                                        }}
                                                    >
                                                        {v.nameAr}
                                                    </div>
                                                ))}
                                            {vendors.filter(v => v.nameAr.toLowerCase().includes(vendorSearch.toLowerCase())).length === 0 && (
                                                <div className="px-3 py-2 text-gray-500 text-sm">لا توجد نتائج</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="form-label">البيان (الوصف) *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="form-input w-full"
                                    placeholder="مثال: شراء أدوات نظافة"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">التاريخ</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.expenseDate}
                                        onChange={e => setFormData({ ...formData, expenseDate: e.target.value })}
                                        className="form-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="form-label">التصنيف</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="form-input w-full"
                                    >
                                        <option value="">اختر التصنيف</option>
                                        <option value="صيانة">صيانة</option>
                                        <option value="نظافة">نظافة</option>
                                        <option value="ضيافة">ضيافة</option>
                                        <option value="مكتبية">مكتبية</option>
                                        <option value="أخرى">أخرى</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="form-label">صورة الفاتورة</label>
                                <label htmlFor="file-upload" className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-[var(--primary-500)] transition-colors cursor-pointer block">
                                    <div className="space-y-1 text-center">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600">
                                            <span className="relative cursor-pointer rounded-md font-medium text-[var(--primary-600)] hover:text-[var(--primary-500)]">
                                                {formData.file ? 'تغيير الملف' : 'رفع ملف'}
                                            </span>
                                            <p className="pl-1">أو اسحب وأفلت</p>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            PNG, JPG, HEIC, PDF يصل إلى 10 ميجابايت
                                        </p>
                                        {formData.file ? (
                                            <p className="text-sm font-medium text-green-600 mt-2">
                                                تم اختيار الملف: {formData.file.name}
                                            </p>
                                        ) : formData.existingImageUrl ? (
                                            <p className="text-sm font-medium text-blue-600 mt-2">
                                                يوجد ملف مرفق حالياً
                                            </p>
                                        ) : null}
                                    </div>
                                </label>
                                <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*,.pdf,.heic,.heif" onChange={handleFileChange} />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn-secondary"
                                    disabled={saving}
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className={`btn-primary flex items-center gap-2 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={saving || isReadOnly}
                                    title={isReadOnly ? "غير متاح" : ""}
                                >
                                    {saving && <Loader2 className="animate-spin" size={16} />}
                                    {isEditing ? 'حفظ التعديلات' : 'حفظ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Image Viewer */}
            {viewImage && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setViewImage(null)}>
                    <div className="max-w-4xl max-h-[90vh] relative">
                        {viewImage.endsWith('.pdf') ? (
                            <iframe src={viewImage} className="w-full h-[85vh] rounded-lg bg-white" title="Invoice PDF"></iframe>
                        ) : (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={viewImage} alt="Invoice" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                        )}
                        <button
                            className="absolute -top-10 right-0 text-white hover:text-gray-300"
                            onClick={() => setViewImage(null)}
                        >
                            <X size={32} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
