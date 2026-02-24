'use client'

import { useState, useEffect } from 'react'
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
    Scissors,
    Utensils,
    Receipt,
    Share2,
    Printer,
    Link as LinkIcon
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'



export interface MealPrices {
    dinner: number
    lunch: number
    breakfast: number
    snacks: number
}

export interface Hall {
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
    // Configuration Fields
    defaultCoffeeServers: number
    defaultSacrifices: number
    defaultWaterCartons: number
    coffeeServerPrice: number
    sacrificePrice: number
    waterCartonPrice: number
    extraSectionPrice: number
    // Booking Defaults
    defaultGuestCount: number
    defaultSectionType: 'men' | 'women' | 'both'
    // Meal Prices
    mealPrices: MealPrices
}

const DEFAULT_MEAL_PRICES: MealPrices = {
    dinner: 150,
    lunch: 100,
    breakfast: 50,
    snacks: 30
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
        defaultWaterCartons: 10,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 500,
        defaultSectionType: 'both' as const,
        mealPrices: { dinner: 150, lunch: 100, breakfast: 50, snacks: 30 }
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
        defaultWaterCartons: 8,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 300,
        defaultSectionType: 'both' as const,
        mealPrices: { dinner: 120, lunch: 80, breakfast: 40, snacks: 25 }
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
        defaultWaterCartons: 4,
        coffeeServerPrice: 100,
        sacrificePrice: 1500,
        waterCartonPrice: 50,
        extraSectionPrice: 1000,
        defaultGuestCount: 100,
        defaultSectionType: 'men' as const,
        mealPrices: { dinner: 200, lunch: 150, breakfast: 80, snacks: 50 }
    }
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    'ACTIVE': { label: 'نشط', color: 'bg-green-100 text-green-800', icon: <CheckCircle size={14} /> },
    'INACTIVE': { label: 'غير نشط', color: 'bg-gray-100 text-gray-800', icon: <XCircle size={14} /> },
    'MAINTENANCE': { label: 'صيانة', color: 'bg-yellow-100 text-yellow-800', icon: <Wrench size={14} /> }
}



import { useSubscription } from '@/hooks/useSubscription'

export default function HallsPage() {
    const { isReadOnly } = useSubscription()
    const [halls, setHalls] = useState<Hall[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingHall, setEditingHall] = useState<Hall | null>(null)
    const [isLoaded, setIsLoaded] = useState(false)

    const [formData, setFormData] = useState({
        nameAr: '',
        capacity: '',
        basePrice: '',
        hourlyRate: '',
        location: '',
        description: '',
        status: 'ACTIVE',
        amenities: '',
        // Service Defaults
        defaultCoffeeServers: '0',
        defaultSacrifices: '0',
        defaultWaterCartons: '0',
        coffeeServerPrice: '100',
        sacrificePrice: '1500',
        waterCartonPrice: '50',
        extraSectionPrice: '1000',
        // Booking Defaults
        defaultGuestCount: '',
        defaultSectionType: 'both',
        // Meal Prices
        mealPriceDinner: '150',
        mealPriceLunch: '100',
        mealPriceBreakfast: '50',
        mealPriceSnacks: '30'
    })

    // Load from API on mount
    useEffect(() => {
        const fetchHalls = async () => {
            try {
                const res = await fetch('/api/halls')
                if (res.ok) {
                    const data = await res.json()
                    setHalls(data)
                } else {
                    console.error('Failed to fetch halls')
                    setHalls(MOCK_HALLS)
                }
            } catch (error) {
                console.error('Failed to fetch halls:', error)
                setHalls(MOCK_HALLS)
            } finally {
                setIsLoaded(true)
            }
        }
        fetchHalls()
    }, [])

    const filteredHalls = halls.filter(h =>
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.location && h.location.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const openAddModal = () => {
        if (isReadOnly) {
            alert('عفواً، حسابك في وضع القراءة فقط بسبب انتهاء الاشتراك. يرجى التجديد لإضافة قاعات.')
            return
        }
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
            defaultWaterCartons: '0',
            coffeeServerPrice: '100',
            sacrificePrice: '1500',
            waterCartonPrice: '50',
            extraSectionPrice: '1000',
            defaultGuestCount: '',
            defaultSectionType: 'both',
            mealPriceDinner: '150',
            mealPriceLunch: '100',
            mealPriceBreakfast: '50',
            mealPriceSnacks: '30'
        })
        setShowModal(true)
    }

    const openEditModal = (hall: Hall) => {
        if (isReadOnly) {
            alert('عفواً، لا يمكن تعديل البيانات في وضع القراءة فقط.')
            return
        }
        setEditingHall(hall)
        // ... (rest of edit logic)
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
            defaultWaterCartons: (hall.defaultWaterCartons || 0).toString(),
            coffeeServerPrice: hall.coffeeServerPrice !== undefined && hall.coffeeServerPrice !== null ? hall.coffeeServerPrice.toString() : '100',
            sacrificePrice: hall.sacrificePrice !== undefined && hall.sacrificePrice !== null ? hall.sacrificePrice.toString() : '1500',
            waterCartonPrice: hall.waterCartonPrice !== undefined && hall.waterCartonPrice !== null ? hall.waterCartonPrice.toString() : '50',
            extraSectionPrice: hall.extraSectionPrice !== undefined && hall.extraSectionPrice !== null ? hall.extraSectionPrice.toString() : '1000',
            defaultGuestCount: hall.defaultGuestCount !== undefined && hall.defaultGuestCount !== null ? hall.defaultGuestCount.toString() : (hall.capacity || '').toString(),
            defaultSectionType: hall.defaultSectionType || 'both',
            mealPriceDinner: hall.mealPrices?.dinner !== undefined && hall.mealPrices?.dinner !== null ? hall.mealPrices.dinner.toString() : '150',
            mealPriceLunch: hall.mealPrices?.lunch !== undefined && hall.mealPrices?.lunch !== null ? hall.mealPrices.lunch.toString() : '100',
            mealPriceBreakfast: hall.mealPrices?.breakfast !== undefined && hall.mealPrices?.breakfast !== null ? hall.mealPrices.breakfast.toString() : '50',
            mealPriceSnacks: hall.mealPrices?.snacks !== undefined && hall.mealPrices?.snacks !== null ? hall.mealPrices.snacks.toString() : '30'
        })
        setShowModal(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (isReadOnly) {
            alert('عفواً، لا يمكن حفظ التغييرات في وضع القراءة فقط.')
            return
        }

        const hallData = {
            id: editingHall?.id,
            nameAr: formData.nameAr,
            capacity: parseInt(formData.capacity) || 0,
            basePrice: parseFloat(formData.basePrice) || 0,
            hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
            location: formData.location || null,
            description: formData.description || null,
            status: formData.status,
            amenities: formData.amenities || null,
            // Service Defaults
            defaultCoffeeServers: parseInt(formData.defaultCoffeeServers) || 0,
            defaultSacrifices: parseInt(formData.defaultSacrifices) || 0,
            defaultWaterCartons: parseInt(formData.defaultWaterCartons) || 0,
            coffeeServerPrice: formData.coffeeServerPrice === '' ? 100 : parseFloat(formData.coffeeServerPrice),
            sacrificePrice: formData.sacrificePrice === '' ? 1500 : parseFloat(formData.sacrificePrice),
            waterCartonPrice: formData.waterCartonPrice === '' ? 50 : parseFloat(formData.waterCartonPrice),
            extraSectionPrice: formData.extraSectionPrice === '' ? 0 : parseFloat(formData.extraSectionPrice),
            // Booking Defaults
            defaultGuestCount: parseInt(formData.defaultGuestCount) || parseInt(formData.capacity) || 0,
            defaultSectionType: formData.defaultSectionType,
            // Meal Prices
            mealPrices: {
                dinner: parseFloat(formData.mealPriceDinner) || 150,
                lunch: parseFloat(formData.mealPriceLunch) || 100,
                breakfast: parseFloat(formData.mealPriceBreakfast) || 50,
                snacks: parseFloat(formData.mealPriceSnacks) || 30
            }
        }

        try {
            const method = editingHall ? 'PUT' : 'POST'
            const res = await fetch('/api/halls', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hallData)
            })

            if (res.ok) {
                // Refresh halls list from API
                const refreshRes = await fetch('/api/halls')
                if (refreshRes.ok) {
                    const data = await refreshRes.json()
                    setHalls(data)
                }
            } else {
                const error = await res.json()
                alert('خطأ في حفظ القاعة: ' + (error.error || 'خطأ غير معروف'))
            }
        } catch (error) {
            console.error('Failed to save hall:', error)
            // Fallback: save locally
            const newHall: Hall = {
                ...hallData,
                id: editingHall?.id || `hall-${Date.now()}`,
                name: hallData.nameAr,
                bookingsCount: editingHall?.bookingsCount || 0,
                createdAt: editingHall?.createdAt || new Date().toISOString(),
                defaultSectionType: hallData.defaultSectionType as 'men' | 'women' | 'both'
            }
            if (editingHall) {
                setHalls(halls.map(h => h.id === editingHall.id ? newHall : h))
            } else {
                setHalls([...halls, newHall])
            }
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        if (isReadOnly) {
            alert('عفواً، لا يمكن حذف البيانات في وضع القراءة فقط.')
            return
        }
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

                <button
                    id="tour-add-hall-btn"
                    onClick={openAddModal}
                    disabled={isReadOnly}
                    className={`btn-primary flex items-center gap-2 ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={isReadOnly ? 'غير متاح في وضع القراءة فقط' : ''}
                >
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
            <div id="tour-halls-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                                <div className="flex flex-wrap gap-1 justify-end">
                                    <button
                                        onClick={() => openEditModal(hall)}
                                        className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                                        title="تعديل"
                                    >
                                        <Edit2 size={16} className="text-gray-500" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(hall.id)}
                                        className="p-2 hover:bg-red-50 rounded-md transition-colors"
                                        title="حذف"
                                    >
                                        <Trash2 size={16} className="text-red-500" />
                                    </button>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="space-y-2">
                            {/* Basic Info */}
                            <div className="space-y-1 text-sm text-[var(--text-secondary)]">
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span>السعة: {hall.capacity} شخص</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <DollarSign size={14} />
                                    <span>السعر: {hall.basePrice.toLocaleString()} ر.س</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-[var(--text-muted)]">القسم:</span>
                                    <span className="font-medium">
                                        {hall.defaultSectionType === 'men' ? 'رجال' :
                                            hall.defaultSectionType === 'women' ? 'نساء' : 'قسمين'}
                                    </span>
                                </div>
                            </div>

                            {/* Services - Compact */}
                            <div className="pt-2 border-t border-[var(--border-color)]">
                                <p className="text-[10px] text-[var(--text-muted)] mb-1">الخدمات:</p>
                                <div className="flex gap-2 text-[10px]">
                                    <div className="bg-amber-50 rounded px-2 py-1 text-center flex-1">
                                        <div className="text-amber-700 font-medium">صبابين</div>
                                        <div>{hall.defaultCoffeeServers || 0} × {hall.coffeeServerPrice !== undefined ? hall.coffeeServerPrice : 0}</div>
                                    </div>
                                    <div className="bg-red-50 rounded px-2 py-1 text-center flex-1">
                                        <div className="text-red-700 font-medium">ذبائح</div>
                                        <div>{hall.defaultSacrifices || 0} × {hall.sacrificePrice !== undefined ? hall.sacrificePrice : 0}</div>
                                    </div>
                                    <div className="bg-blue-50 rounded px-2 py-1 text-center flex-1">
                                        <div className="text-blue-700 font-medium">ماء</div>
                                        <div>{hall.defaultWaterCartons || 0} × {hall.waterCartonPrice !== undefined ? hall.waterCartonPrice : 0}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats - Bookings Count */}
                            <div className="pt-2 border-t border-[var(--border-color)] flex justify-between items-center">
                                <span className="text-sm text-[var(--text-secondary)]">الحجوزات</span>
                                <span className="text-lg font-bold text-[var(--primary-700)]">{hall.bookingsCount}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {filteredHalls.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12">
                    <Building2 className="text-gray-300 mb-4" size={64} />
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

                            {/* Default Services Settings Section */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                                    <Settings size={16} /> إعدادات الخدمات الافتراضية
                                </h4>

                                <div className="grid grid-cols-3 gap-4">
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

                                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg border">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">كراتين الماء</Label>
                                        <div>
                                            <Label className="text-xs">العدد الافتراضي</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.defaultWaterCartons}
                                                onChange={e => setFormData({ ...formData, defaultWaterCartons: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">السعر للكرتون (ر.س)</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                value={formData.waterCartonPrice}
                                                onChange={e => setFormData({ ...formData, waterCartonPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Booking Defaults Section */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                                    <Users size={16} /> إعدادات الحجز الافتراضية
                                </h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {/* Hidden: عدد الضيوف الافتراضي
                                    <div>
                                        <Label>عدد الضيوف الافتراضي</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="يساوي السعة إذا ترك فارغاً"
                                            value={formData.defaultGuestCount}
                                            onChange={e => setFormData({ ...formData, defaultGuestCount: e.target.value })}
                                        />
                                        <p className="text-[10px] text-slate-500 mt-1">العدد الافتراضي للوجبات أثناء الحجز</p>
                                    </div>
                                    */}
                                    <div>
                                        <Label>الأقسام الافتراضية</Label>
                                        <select
                                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                                            value={formData.defaultSectionType}
                                            onChange={e => setFormData({ ...formData, defaultSectionType: e.target.value })}
                                        >
                                            <option value="men">رجال فقط</option>
                                            <option value="women">نساء فقط</option>
                                            <option value="both">قسمين (رجال ونساء)</option>
                                        </select>
                                        <p className="text-[10px] text-slate-500 mt-1">نوع الأقسام الافتراضي للحجز</p>
                                    </div>
                                </div>
                            </div>

                            {/* TEMPORARILY HIDDEN - Meal Prices Section
                            <div className="space-y-4">
                                <h4 className="font-medium text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
                                    <Utensils size={16} /> أسعار الوجبات (للشخص الواحد)
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <Label className="text-xs">عشاء (ر.س)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.mealPriceDinner}
                                            onChange={e => setFormData({ ...formData, mealPriceDinner: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">غداء (ر.س)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.mealPriceLunch}
                                            onChange={e => setFormData({ ...formData, mealPriceLunch: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">فطور (ر.س)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.mealPriceBreakfast}
                                            onChange={e => setFormData({ ...formData, mealPriceBreakfast: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">وجبات خفيفة (ر.س)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={formData.mealPriceSnacks}
                                            onChange={e => setFormData({ ...formData, mealPriceSnacks: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            END OF MEAL PRICES SECTION */}


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
