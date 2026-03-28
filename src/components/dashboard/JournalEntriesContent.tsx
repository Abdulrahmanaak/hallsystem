'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
    BookOpen,
    DollarSign,
    Plus,
    Search,
    Loader2,
    Trash2,
    RefreshCw,
    CheckCircle2,
    Pencil,
    Ban,
    Link2Off,
    X
} from 'lucide-react'

import { useSubscription } from '@/hooks/useSubscription'

interface JournalEntry {
    id: string
    entryNumber: string
    month: number
    year: number
    description: string | null
    amount: number
    categoryId: number
    categoryName: string
    syncedToQoyod: boolean
    qoyodJournalEntryId: string | null
    isDeleted: boolean
    deletedAt: string | null
    createdBy: {
        nameAr: string
        username: string
    }
}

interface QoyodCategory {
    id: number
    name: string
    name_ar?: string
    name_en?: string
}

const MONTHS_AR = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
]

export function JournalEntriesContent() {
    const { isReadOnly } = useSubscription()
    const [entries, setEntries] = useState<JournalEntry[]>([])
    const [categories, setCategories] = useState<QoyodCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [loadingCategories, setLoadingCategories] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear())
    const [filterMonth, setFilterMonth] = useState<number | ''>('')

    // Modal
    const [showModal, setShowModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    // Form
    const [formData, setFormData] = useState({
        amount: '',
        month: (new Date().getMonth() + 1).toString(),
        year: new Date().getFullYear().toString(),
        categoryId: '',
        categoryName: '',
        description: ''
    })
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [syncingId, setSyncingId] = useState<string | null>(null)
    const [showNewCategory, setShowNewCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState('')
    const [savingCategory, setSavingCategory] = useState(false)
    const [importingFromQoyod, setImportingFromQoyod] = useState(false)

    const fetchEntries = async () => {
        try {
            let url = '/api/journal-entries?limit=200'
            if (filterYear) url += `&year=${filterYear}`
            if (filterMonth) url += `&month=${filterMonth}`
            const res = await fetch(url)
            const data = await res.json()
            if (Array.isArray(data)) setEntries(data)
        } catch (error) {
            console.error('Error fetching journal entries:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchCategories = async () => {
        setLoadingCategories(true)
        try {
            const res = await fetch('/api/qoyod?action=product-categories')
            const data = await res.json()
            if (data.success && Array.isArray(data.categories)) {
                setCategories(data.categories)
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            setLoadingCategories(false)
        }
    }

    const importFromQoyod = async () => {
        setImportingFromQoyod(true)
        try {
            const res = await fetch('/api/qoyod?action=journal-entries')
            const data = await res.json()
            if (!data.success || !Array.isArray(data.journalEntries)) {
                alert(data.error || 'فشل جلب القيود من قيود')
                return
            }

            if (data.journalEntries.length === 0) {
                alert('لا توجد قيود يدوية في قيود')
                return
            }

            // Import each entry that doesn't already exist locally
            let imported = 0
            let skipped = 0
            for (const qEntry of data.journalEntries) {
                // Check if already imported by qoyodJournalEntryId
                const existing = entries.find(e => e.qoyodJournalEntryId === qEntry.id?.toString())
                if (existing) {
                    skipped++
                    continue
                }

                const entryDate = qEntry.date ? new Date(qEntry.date) : new Date()
                const month = entryDate.getMonth() + 1
                const year = entryDate.getFullYear()

                // Calculate total amount from lines
                const totalDebit = (qEntry.journal_entry_lines || []).reduce(
                    (sum: number, line: { debit?: number }) => sum + (Number(line.debit) || 0), 0
                )

                try {
                    await fetch('/api/journal-entries/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            qoyodId: qEntry.id?.toString(),
                            month,
                            year,
                            amount: totalDebit || 0,
                            categoryName: qEntry.description || 'قيد من قيود',
                            description: qEntry.reference || qEntry.description || '',
                        })
                    })
                    imported++
                } catch {
                    console.error('Failed to import entry:', qEntry.id)
                }
            }

            alert(`تم استيراد ${imported} قيد جديد${skipped > 0 ? ` (${skipped} موجود مسبقاً)` : ''}`)
            fetchEntries()
        } catch (error) {
            console.error('Error importing from Qoyod:', error)
            alert('حدث خطأ أثناء الاستيراد من قيود')
        } finally {
            setImportingFromQoyod(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchEntries()
    }, [filterYear, filterMonth])

    const startAdd = () => {
        setIsEditing(false)
        setEditId(null)
        setFormData({
            amount: '',
            month: (new Date().getMonth() + 1).toString(),
            year: new Date().getFullYear().toString(),
            categoryId: '',
            categoryName: '',
            description: ''
        })
        setShowNewCategory(false)
        setNewCategoryName('')
        setShowModal(true)
    }

    const startEdit = (entry: JournalEntry) => {
        setIsEditing(true)
        setEditId(entry.id)
        setFormData({
            amount: entry.amount.toString(),
            month: entry.month.toString(),
            year: entry.year.toString(),
            categoryId: entry.categoryId.toString(),
            categoryName: entry.categoryName,
            description: entry.description || ''
        })
        setShowNewCategory(false)
        setNewCategoryName('')
        setShowModal(true)
    }

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value
        const cat = categories.find(c => c.id.toString() === selectedId)
        setFormData({
            ...formData,
            categoryId: selectedId,
            categoryName: cat ? (cat.name_ar || cat.name || cat.name_en || '') : ''
        })
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) return
        setSavingCategory(true)
        try {
            const res = await fetch('/api/qoyod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'create-category', name: newCategoryName.trim() })
            })
            const data = await res.json()
            if (res.ok && data.success) {
                // Add to local list and select it
                const newCat = data.category
                setCategories(prev => [...prev, newCat])
                setFormData({
                    ...formData,
                    categoryId: newCat.id.toString(),
                    categoryName: newCat.name_ar || newCat.name || newCategoryName.trim()
                })
                setNewCategoryName('')
                setShowNewCategory(false)
            } else {
                alert(data.error || 'فشل إضافة الصنف')
            }
        } catch {
            alert('حدث خطأ أثناء إضافة الصنف')
        } finally {
            setSavingCategory(false)
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
            const url = isEditing && editId ? `/api/journal-entries/${editId}` : '/api/journal-entries'
            const method = isEditing ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    month: parseInt(formData.month),
                    year: parseInt(formData.year),
                    categoryId: parseInt(formData.categoryId),
                    categoryName: formData.categoryName,
                    description: formData.description || null
                })
            })

            const data = await res.json()

            if (res.ok) {
                setShowModal(false)
                fetchEntries()
            } else {
                alert(data.error || 'حدث خطأ غير متوقع')
            }
        } catch (error) {
            console.error('Error saving journal entry:', error)
            alert('حدث خطأ أثناء حفظ القيد')
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        const entry = entries.find(e => e.id === id)
        const msg = entry?.syncedToQoyod
            ? 'هل أنت متأكد من حذف هذا القيد؟ سيتم حذفه من نظام قيود أيضاً.'
            : 'هل أنت متأكد من حذف هذا القيد؟'
        if (!confirm(msg)) return

        setDeletingId(id)
        try {
            const res = await fetch(`/api/journal-entries/${id}`, { method: 'DELETE' })
            if (res.ok) {
                const data = await res.json()
                if (data.qoyodDeleted) {
                    alert('تم حذف القيد محلياً ومن قيود بنجاح')
                } else {
                    alert('تم حذف القيد بنجاح')
                }
                fetchEntries()
            } else {
                const data = await res.json()
                alert(data.error || 'فشل حذف القيد')
            }
        } catch (error) {
            console.error('Error deleting:', error)
            alert('حدث خطأ أثناء الحذف')
        } finally {
            setDeletingId(null)
        }
    }

    const handleSync = async (id: string) => {
        setSyncingId(id)
        try {
            const res = await fetch('/api/qoyod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'journal-entry', id })
            })
            const data = await res.json()
            if (res.ok) {
                alert('تم مزامنة القيد مع قيود بنجاح')
                fetchEntries()
            } else {
                alert(data.error || 'فشل المزامنة')
            }
        } catch {
            alert('حدث خطأ في الاتصال')
        } finally {
            setSyncingId(null)
        }
    }

    const handleUnlink = async (id: string) => {
        if (!confirm('هل أنت متأكد من فك ربط هذا القيد من قيود؟')) return

        setDeletingId(id)
        try {
            const res = await fetch('/api/qoyod', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'unlink-journal-entry', id })
            })
            if (res.ok) {
                alert('تم فك الارتباط مع قيود بنجاح')
                fetchEntries()
            } else {
                const data = await res.json()
                alert(data.error || 'فشل فك الارتباط')
            }
        } catch {
            alert('حدث خطأ أثناء فك الارتباط')
        } finally {
            setDeletingId(null)
        }
    }

    const filteredEntries = entries.filter(e =>
        e.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const activeEntries = entries.filter(e => !e.isDeleted)
    const totalStats = {
        count: activeEntries.length,
        amount: activeEntries.reduce((sum, e) => sum + Number(e.amount), 0),
        synced: activeEntries.filter(e => e.syncedToQoyod).length
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
                        القيود اليدوية
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إدارة القيود اليدوية ومزامنتها مع قيود
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={importFromQoyod}
                        disabled={importingFromQoyod}
                        className="btn-secondary flex items-center gap-2"
                        title="استيراد القيود من قيود"
                    >
                        {importingFromQoyod ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                        تحديث من قيود
                    </button>
                    <button
                        onClick={startAdd}
                        disabled={isReadOnly}
                        className={`btn-primary flex items-center gap-2 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={isReadOnly ? "غير متاح في وضع القراءة فقط" : ""}
                    >
                        <Plus size={18} />
                        إضافة قيد
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-50)] rounded-full">
                                <BookOpen className="text-[var(--primary-600)]" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">عدد القيود</p>
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
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي المبالغ</p>
                                <p className="text-2xl font-bold text-red-600">{totalStats.amount.toLocaleString()} ر.س</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full">
                                <CheckCircle2 className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">مزامنة مع قيود</p>
                                <p className="text-2xl font-bold text-green-600">{totalStats.synced}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="بحث بالصنف أو رقم القيد..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="form-input pr-10 w-full"
                            />
                        </div>
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(e.target.value ? parseInt(e.target.value) : '')}
                            className="form-input w-full md:w-40"
                        >
                            <option value="">كل الأشهر</option>
                            {MONTHS_AR.map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <input
                            type="number"
                            value={filterYear}
                            onChange={(e) => setFilterYear(parseInt(e.target.value) || new Date().getFullYear())}
                            className="form-input w-full md:w-28"
                            min={2020}
                            max={2050}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card className="bg-white border border-[var(--border-color)]">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>رقم القيد</th>
                                    <th>الشهر</th>
                                    <th>الصنف</th>
                                    <th>المبلغ</th>
                                    <th>ملاحظات</th>
                                    <th>الحالة</th>
                                    <th>سجل بواسطة</th>
                                    <th>قيود</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntries.map(entry => (
                                    <tr key={entry.id}>
                                        <td className="font-mono text-sm">{entry.entryNumber}</td>
                                        <td>{MONTHS_AR[entry.month - 1]} {entry.year}</td>
                                        <td>
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs">
                                                {entry.categoryName}
                                            </span>
                                        </td>
                                        <td className="font-bold text-[var(--text-primary)]">
                                            {Number(entry.amount).toLocaleString()} ر.س
                                        </td>
                                        <td className="text-sm text-gray-500">
                                            {entry.description || '-'}
                                        </td>
                                        <td>
                                            {entry.isDeleted ? (
                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                    محذوف
                                                </span>
                                            ) : (
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-semibold">
                                                    نشط
                                                </span>
                                            )}
                                        </td>
                                        <td className="text-sm text-gray-500">{entry.createdBy.nameAr}</td>
                                        <td>
                                            {!entry.isDeleted && (
                                                entry.syncedToQoyod ? (
                                                    <span className="flex items-center gap-1 text-green-600 text-sm">
                                                        <CheckCircle2 size={16} />
                                                        <span>مربوط</span>
                                                    </span>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSync(entry.id)}
                                                        disabled={syncingId === entry.id}
                                                        className="p-1 px-2 text-blue-600 hover:bg-blue-50 rounded-md flex items-center gap-1 text-sm border border-blue-200"
                                                        title="مزامنة مع قيود"
                                                    >
                                                        {syncingId === entry.id ? (
                                                            <Loader2 size={14} className="animate-spin" />
                                                        ) : (
                                                            <RefreshCw size={14} />
                                                        )}
                                                        <span>ربط</span>
                                                    </button>
                                                )
                                            )}
                                        </td>
                                        <td>
                                            {!entry.isDeleted ? (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => startEdit(entry)}
                                                        className="p-1 text-gray-600 hover:text-[var(--primary-600)] hover:bg-gray-100 rounded-md transition-colors"
                                                        title="تعديل"
                                                        disabled={isReadOnly}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    {entry.syncedToQoyod && (
                                                        <button
                                                            onClick={() => handleUnlink(entry.id)}
                                                            disabled={deletingId === entry.id || isReadOnly}
                                                            className="p-1 text-orange-500 hover:bg-orange-50 rounded-md transition-colors"
                                                            title="فك الربط من قيود"
                                                        >
                                                            {deletingId === entry.id ? <Loader2 size={16} className="animate-spin" /> : <Link2Off size={16} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(entry.id)}
                                                        disabled={deletingId === entry.id || isReadOnly}
                                                        className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                        title="حذف القيد"
                                                    >
                                                        {deletingId === entry.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
                    {filteredEntries.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="text-gray-300 mb-4" size={64} />
                            <p className="text-[var(--text-secondary)]">
                                {searchTerm || filterMonth
                                    ? 'لا توجد نتائج مطابقة للبحث'
                                    : 'لا توجد قيود يدوية'}
                            </p>
                            {(searchTerm || filterMonth) && (
                                <button
                                    onClick={() => { setSearchTerm(''); setFilterMonth('') }}
                                    className="mt-2 text-sm text-[var(--primary-600)] hover:underline"
                                >
                                    مسح الفلاتر
                                </button>
                            )}
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
                                {isEditing ? 'تعديل القيد' : 'إضافة قيد جديد'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-md">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                            {/* Month & Year */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">الشهر *</label>
                                    <select
                                        required
                                        value={formData.month}
                                        onChange={e => setFormData({ ...formData, month: e.target.value })}
                                        className="form-input w-full"
                                    >
                                        {MONTHS_AR.map((m, i) => (
                                            <option key={i} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">السنة *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        className="form-input w-full"
                                        min={2020}
                                        max={2050}
                                    />
                                </div>
                            </div>

                            {/* Category */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="form-label mb-0">الصنف *</label>
                                    <button
                                        type="button"
                                        onClick={fetchCategories}
                                        disabled={loadingCategories}
                                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    >
                                        {loadingCategories ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                        تحديث الأصناف
                                    </button>
                                </div>
                                <select
                                    required={!showNewCategory}
                                    value={formData.categoryId}
                                    onChange={handleCategoryChange}
                                    className="form-input w-full"
                                    disabled={showNewCategory}
                                >
                                    <option value="">اختر الصنف</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name_ar || cat.name || cat.name_en}
                                        </option>
                                    ))}
                                </select>

                                {!showNewCategory ? (
                                    <button
                                        type="button"
                                        onClick={() => setShowNewCategory(true)}
                                        className="text-xs text-green-600 hover:underline flex items-center gap-1 mt-1"
                                    >
                                        <Plus size={12} />
                                        إضافة صنف جديد
                                    </button>
                                ) : (
                                    <div className="mt-2 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="اسم الصنف الجديد..."
                                            value={newCategoryName}
                                            onChange={e => setNewCategoryName(e.target.value)}
                                            className="form-input flex-1"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={handleCreateCategory}
                                            disabled={savingCategory || !newCategoryName.trim()}
                                            className="btn-primary text-xs px-3 flex items-center gap-1"
                                        >
                                            {savingCategory ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                                            إضافة
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowNewCategory(false); setNewCategoryName('') }}
                                            className="btn-secondary text-xs px-2"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {categories.length === 0 && !loadingCategories && !showNewCategory && (
                                    <p className="text-xs text-orange-500 mt-1">
                                        لم يتم العثور على أصناف. تأكد من تفعيل تكامل قيود في الإعدادات.
                                    </p>
                                )}
                            </div>

                            {/* Amount */}
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

                            {/* Description */}
                            <div>
                                <label className="form-label">ملاحظات</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="form-input w-full"
                                    rows={3}
                                    placeholder="ملاحظات إضافية (اختياري)"
                                />
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
        </div>
    )
}
