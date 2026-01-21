// Bookings Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const BOOKINGS_TOUR_ID = 'bookings-tour'

export const bookingsTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '📅 إدارة الحجوزات',
    text: `
      <p>مرحباً بك في صفحة إدارة الحجوزات!</p>
      <p class="mt-2">هنا يمكنك إنشاء وعرض وتعديل جميع حجوزات القاعة.</p>
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
    id: 'add-booking',
    attachTo: { element: '#tour-add-booking-btn', on: 'auto' },
    title: '➕ حجز جديد',
    text: `
      <p>اضغط هنا لإنشاء حجز جديد.</p>
      <p class="mt-2 text-sm text-gray-500">ستفتح نافذة لإدخال بيانات الحجز</p>
    `
  },
  {
    id: 'search',
    attachTo: { element: '#tour-booking-search', on: 'auto' },
    title: '🔍 البحث',
    text: `
      <p>ابحث عن الحجوزات باستخدام:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>رقم الحجز</li>
        <li>اسم العميل</li>
        <li>رقم الهاتف</li>
      </ul>
    `
  },
  {
    id: 'filters',
    attachTo: { element: '#tour-booking-filter', on: 'auto' },
    title: '🎯 التصفية',
    text: `
      <p>استخدم الفلاتر لتصفية الحجوزات حسب:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>الحالة (مؤكد، معلق، ملغي)</li>
        <li>القاعة</li>
        <li>التاريخ</li>
      </ul>
    `
  },
  {
    id: 'booking-table',
    attachTo: { element: '#tour-booking-table', on: 'auto' },
    title: '📋 قائمة الحجوزات',
    text: `
      <p>هنا تظهر جميع الحجوزات مع:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>رقم الحجز والتاريخ</li>
        <li>اسم العميل والقاعة</li>
        <li>نوع المناسبة والحالة</li>
        <li>المبلغ الإجمالي</li>
      </ul>
    `
  },
  {
    id: 'status-badges',

    title: '🏷️ حالات الحجز',
    text: `
      <p>الألوان تدل على حالة الحجز:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><span class="text-green-600">●</span> أخضر: مؤكد</li>
        <li><span class="text-yellow-600">●</span> أصفر: معلق</li>
        <li><span class="text-red-600">●</span> أحمر: ملغي</li>
        <li><span class="text-blue-600">●</span> أزرق: مكتمل</li>
      </ul>
    `
  },
  {
    id: 'actions',

    title: '⚙️ إجراءات الحجز',
    text: `
      <p>لكل حجز يمكنك:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>👁️ عرض التفاصيل</li>
        <li>✏️ تعديل البيانات</li>
        <li>🗑️ حذف الحجز</li>
      </ul>
    `
  },
  {
    id: 'hijri-calendar',
    title: '📆 التقويم الهجري',
    text: `
      <p>عند إنشاء حجز جديد، يمكنك اختيار التاريخ بـ:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>التقويم الميلادي</li>
        <li>التقويم الهجري</li>
      </ul>
      <p class="mt-2 text-sm text-gray-500">النظام يحول بينهما تلقائياً</p>
    `
  }
]
