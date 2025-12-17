'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Building2,
    Plus,
    Search,
    Users,
    DollarSign,
    MapPin,
    Edit2,
    Trash2,
    X,
    CheckCircle,
    XCircle,
    Wrench,
    Settings,
    Coffee,
    Scissors
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface Hall {
    id: string
    name: string
    capacity: number
    basePrice: number
    hourlyRate: number | null
    amenities: string | null
    location: string | null
    description: string | null
    status: string
    bookingsCount: number
    createdAt: string
    // New Configuration Fields
    defaultCoffeeServers: number
    defaultSacrifices: number
    coffeeServerPrice: number
    sacrificePrice: number
    extraSectionPrice: number
}

const MOCK_HALLS: Hall[] = [
    {
        id: 'hall-1',
        name: 'القاعة الكبرى',
        capacity: 500,
        basePrice: 5000,
        hourlyRate: null,
        amenities: 'مجهزة بالكامل',
        location: 'الدور الأرضي',
        description: 'قاعة فاخرة مناسبة للأعراس والمناسبات الكبيرة',
        status: 'ACTIVE',
        bookingsCount: 12,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 10,
        defaultSacrifices: 5,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        extraSectionPrice: 1000
    },
    {
        id: 'hall-2',
        name: 'قاعة الحديقة',
        capacity: 300,
        basePrice: 3500,
        hourlyRate: null,
        amenities: 'إطلالة خارجية',
        location: 'الحديقة الخارجية',
        description: 'قاعة مفتوحة مع تشجير وإضاءة خافتة',
        status: 'ACTIVE',
        bookingsCount: 8,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 6,
        defaultSacrifices: 3,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        extraSectionPrice: 1000
    },
    {
        id: 'hall-3',
        name: 'الجناح الملكي',
        capacity: 100,
        basePrice: 1500,
        hourlyRate: null,
        amenities: 'خدمة VIP',
        location: 'الدور الثاني',
        description: 'جناح خاص للمناسبات الصغيرة والاجتماعات',
        status: 'ACTIVE',
        bookingsCount: 5,
        createdAt: new Date().toISOString(),
        defaultCoffeeServers: 2,
        defaultSacrifices: 0,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        extraSectionPrice: 1000
    }
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'ACTIVE': { label: 'نشط', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
    'INACTIVE': { label: 'غير نشط', color: 'bg-gray-100 text-gray-800', icon: <XCircle size={14} /> },
    'MAINTENANCE': { label: 'صيانة', color: 'bg-yellow-100 text-yellow-800', icon: <Wrench size={14} /> }
}

export default function HallsPage() {
    const [halls, setHalls] = useState<Hall[]>(MOCK_HALLS)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingHall, setEditingHall] = useState<Hall | null>(null)

    const [formData, setFormData] = useState({
        nameAr: '',
        capacity: '',
        basePrice: '',
        hourlyRate: '',
        location: '',
        description: '',
        status: 'ACTIVE',
        amenities: '',
        // New Fields
        defaultCoffeeServers: '0',
        defaultSacrifices: '0',
        coffeeServerPrice: '100',
        sacrificePrice: '1500',
        extraSectionPrice: '1000'
    })

    const filteredHalls = halls.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.location && h.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const openAddModal = () => {
        setEditingHall(null)
        setFormData({
            nameAr: '',
            capacity: '',
            basePrice: '',
            hourlyRate: '',
            location: '',
            description: '',
            status: 'ACTIVE',
            amenities: '',
            defaultCoffeeServers: '0',
            defaultSacrifices: '0',
            coffeeServerPrice: '100',
            sacrificePrice: '1500',
            extraSectionPrice: '1000'
        })
        setShowModal(true)
    }

    const openEditModal = (hall: Hall) => {
        setEditingHall(hall)
        setFormData({
            nameAr: hall.name,
            capacity: hall.capacity.toString(),
            basePrice: hall.basePrice.toString(),
            hourlyRate: hall.hourlyRate?.toString() || '',
            location: hall.location || '',
            description: hall.description || '',
            status: hall.status,
            amenities: hall.amenities || '',
            defaultCoffeeServers: hall.defaultCoffeeServers.toString(),
            defaultSacrifices: hall.defaultSacrifices.toString(),
            coffeeServerPrice: hall.coffeeServerPrice.toString(),
            sacrificePrice: hall.sacrificePrice.toString(),
            extraSectionPrice: hall.extraSectionPrice.toString()
        })
        setShowModal(true)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const newHall: Hall = {
            id: editingHall ? editingHall.id : `hall-${Date.now()}`,
            name: formData.nameAr,
            capacity: parseInt(formData.capacity) || 0,
            basePrice: parseFloat(formData.basePrice) || 0,
            hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
            location: formData.location || null,
            description: formData.description || null,
            status: formData.status,
            amenities: formData.amenities || null,
            bookingsCount: editingHall ? editingHall.bookingsCount : 0,
            createdAt: editingHall ? editingHall.createdAt : new Date().toISOString(),
            // New Fields
            defaultCoffeeServers: parseInt(formData.defaultCoffeeServers) || 0,
            defaultSacrifices: parseInt(formData.defaultSacrifices) || 0,
            coffeeServerPrice: parseFloat(formData.coffeeServerPrice) || 0,
            sacrificePrice: parseFloat(formData.sacrificePrice) || 0,
            extraSectionPrice: parseFloat(formData.extraSectionPrice) || 0
        }

        if (editingHall) {
            setHalls(halls.map(h => h.id === editingHall.id ? newHall : h))
        } else {
            setHalls([...halls, newHall])
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه القاعة؟')) return
        setHalls(halls.filter(h => h.id !== id))
    }

    const totalCapacity = halls.reduce((sum, h) => sum + h.capacity, 0)
    const activeHalls = halls.filter(h => h.status === 'ACTIVE').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--text-primary)]">
                        القاعات
                    </h1>
                    <p className="text-[var(--text-secondary)] mt-1">
                        إدارة القاعات والغرف
                    </p>
                </div>

                <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
                    <Plus size={20} />
                    إضافة قاعة
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-[var(--primary-50)] rounded-full">
                                <Building2 className="text-[var(--primary-600)]" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي القاعات</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{halls.length}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-50 rounded-full">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">قاعات نشطة</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{activeHalls}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-full">
                                <Users className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">إجمالي السعة</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">{totalCapacity}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border border-[var(--border-color)]">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-yellow-50 rounded-full">
                                <Wrench className="text-yellow-600" size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-[var(--text-secondary)]">في الصيانة</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)]">
                                    {halls.filter(h => h.status === 'MAINTENANCE').length}
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
                            placeholder="بحث بالاسم أو الموقع..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="form-input pr-10 w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Halls Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHalls.map(hall => (
                    <Card key={hall.id} className="bg-white border border-[var(--border-color)] hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-[var(--primary-50)] flex items-center justify-center">
                                        <Building2 className="text-[var(--primary-600)]" size={24} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">{hall.name}</CardTitle>
                                        <span className={`
                                            text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1
                                            ${STATUS_CONFIG[hall.status]?.color || 'bg-gray-100 text-gray-700'}
                                        `}>
                                            {STATUS_CONFIG[hall.status]?.icon}
                                            {STATUS_CONFIG[hall.status]?.label || hall.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEditModal(hall)}
                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                    >
                                        <Edit2 size={16} className="text-gray-500" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(hall.id)}
                                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                            {/* Info */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <Users size={14} />
                                    <span>السعة: {hall.capacity} شخص</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                    <DollarSign size={14} />
                                    <span>السعر: {hall.basePrice.toLocaleString()} ر.س</span>
                                </div>
                                {hall.location && (
                                    <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                                        <MapPin size={14} />
                                        <span>{hall.location}</span>
                                    </div>
                                )}
                            </div>

                            {/* Configuration Preview */}
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded">
                                <div className='flex items-center gap-1'>
                                    <Coffee size={12} /> {hall.defaultCoffeeServers} قهوجي
                                </div>
                                <div className='flex items-center gap-1'>
                                    <Scissors size={12} /> {hall.defaultSacrifices} ذبائح
                                </div>
                            </div>

                            {hall.description && (
                                <p className="text-sm text-[var(--text-muted)] line-clamp-2">
                                    {hall.description}
                                </p>
                            )}

                            {/* Stats */}
                            <div className="pt-3 border-t border-[var(--border-color)] flex justify-between items-center">
                                <span className="text-sm text-[var(--text-secondary)]">الحجوزات</span>
                                <span className="text-lg font-bold text-[var(--primary-700)]">{hall.bookingsCount}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredHalls.length === 0 && (
                <div className="text-center py-12">
                    <Building2 className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-[var(--text-secondary)]">
                        {searchTerm ? 'لا توجد نتائج للبحث' : 'لا توجد قاعات بعد'}
                    </p>
                    {!searchTerm && (
                        <button onClick={openAddModal} className="btn-primary mt-4">
                            إضافة أول قاعة
                        </button>
                    )}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
                            <h3 className="text-lg font-bold">
                                {editingHall ? 'تعديل القاعة' : 'إضافة قاعة جديدة'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-md"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-6">

                            {/* Basic Info */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                                    <Building2 size={16} /> البيانات الأساسية
                                </h4>
                                <div>
                                    <label className="form-label">اسم القاعة *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nameAr}
                                        onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                        className="form-input w-full"
                                        placeholder="اسم القاعة"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="form-label">السعة *</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.capacity}
                                            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                                            className="form-input w-full"
                                            placeholder="عدد الأشخاص"
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label">السعر الأساسي *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="0.01"
                                            value={formData.basePrice}
                                            onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                                            className="form-input w-full"
                                            placeholder="ر.س"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Configuration Defaults */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                                    <Settings size={16} /> إعدادات الخدمات الافتراضية
                                </h4>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* Coffee Servers */}
                                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">عمال الضيافة (القهوجية)</Label>
                                        <div>
                                            <Label className="text-xs">العدد الافتراضي</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.defaultCoffeeServers}
                                                onChange={e => setFormData({ ...formData, defaultCoffeeServers: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">السعر للعامل (ر.س)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.coffeeServerPrice}
                                                onChange={e => setFormData({ ...formData, coffeeServerPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Sacrifices */}
                                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">الذبائح</Label>
                                        <div>
                                            <Label className="text-xs">العدد الافتراضي</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.defaultSacrifices}
                                                onChange={e => setFormData({ ...formData, defaultSacrifices: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">السعر للذبيحة (ر.س)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.sacrificePrice}
                                                onChange={e => setFormData({ ...formData, sacrificePrice: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label>سعر إضافة قسم ثاني (ر.س)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.extraSectionPrice}
                                            onChange={e => setFormData({ ...formData, extraSectionPrice: e.target.value })}
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">يضاف عند اختيار "قسمين"</p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Info */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                                    <MapPin size={16} /> معلومات إضافية
                                </h4>
                                <div>
                                    <label className="form-label">الموقع</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="form-input w-full"
                                        placeholder="الطابق / المبنى"
                                    />
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
                                        <option value="MAINTENANCE">صيانة</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">الوصف</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="form-input w-full"
                                        rows={3}
                                        placeholder="وصف القاعة والمميزات..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                <button
                                    type="submit"
                                    className="btn-primary flex-1"
                                >
                                    {editingHall ? 'حفظ التعديلات' : 'إضافة القاعة'}
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
