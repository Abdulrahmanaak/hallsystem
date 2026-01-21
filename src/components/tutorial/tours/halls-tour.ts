// Halls Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const HALLS_TOUR_ID = 'halls-tour'

export const hallsTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '🏢 إدارة القاعات',
    text: `
      <p>مرحباً بك في صفحة إدارة القاعات!</p>
      <p class="mt-2">هنا يمكنك إعداد وتكوين القاعات وأسعارها.</p>
    `,
    buttons: [
      {
        text: 'فهمت، التالي',
        action: function (this: Tour) { this.next() },
        classes: 'shepherd-button shepherd-button-primary'
      }
    ]
  },
  {
    id: 'add-hall',

    title: '➕ إضافة قاعة',
    text: `
      <p>اضغط هنا لإضافة قاعة جديدة.</p>
      <p class="mt-2 text-sm text-gray-500">أدخل اسم القاعة والسعة والسعر الأساسي</p>
    `
  },
  {
    id: 'hall-card',

    title: '🎫 بطاقة القاعة',
    text: `
      <p>كل بطاقة تعرض معلومات القاعة:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>الاسم:</strong> اسم القاعة</li>
        <li><strong>السعة:</strong> الحد الأقصى للضيوف</li>
        <li><strong>السعر:</strong> السعر الأساسي</li>
        <li><strong>الحالة:</strong> نشط/غير نشط/صيانة</li>
      </ul>
    `
  },
  {
    id: 'pricing',
    title: '💰 إعداد الأسعار',
    text: `
      <p>لكل قاعة يمكنك تحديد:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>السعر الأساسي:</strong> سعر الحجز</li>
        <li><strong>أسعار الوجبات:</strong> عشاء، غداء، فطور</li>
        <li><strong>أسعار الخدمات:</strong> صبابين، ذبائح، ماء</li>
        <li><strong>سعر القسم الإضافي:</strong> رجال + نساء</li>
      </ul>
    `
  },
  {
    id: 'status',

    title: '🏷️ حالة القاعة',
    text: `
      <p>حالات القاعة:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><span class="text-green-600">●</span> نشط: متاحة للحجز</li>
        <li><span class="text-gray-600">●</span> غير نشط: غير متاحة</li>
        <li><span class="text-yellow-600">●</span> صيانة: مغلقة مؤقتاً</li>
      </ul>
    `
  }
]
