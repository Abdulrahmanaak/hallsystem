// Dashboard Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const DASHBOARD_TOUR_ID = 'dashboard-tour'

export const dashboardTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '🎉 مرحباً بك في نظام إدارة القاعات',
    text: `
      <p>هذه الجولة التعريفية ستساعدك على التعرف على أهم ميزات لوحة التحكم.</p>
      <p class="mt-2 text-sm text-gray-500">يمكنك إنهاء الجولة في أي وقت بالضغط على زر X</p>
    `,
    buttons: [
      {
        text: 'ابدأ الجولة',
        action: function (this: Tour) { this.next() },
        classes: 'shepherd-button shepherd-button-primary'
      }
    ]
  },
  {
    id: 'stats-cards',
    attachTo: { element: '#tour-stats-cards', on: 'auto' },
    title: '📊 البطاقات الإحصائية',
    text: `
      <p>هنا تجد ملخصاً سريعاً لأداء القاعة:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>إجمالي الحجوزات:</strong> عدد جميع الحجوزات</li>
        <li><strong>الحجوزات المؤكدة:</strong> الحجوزات الجاهزة للتنفيذ</li>
        <li><strong>الحجوزات المعلقة:</strong> بانتظار التأكيد</li>
        <li><strong>إجمالي الإيرادات:</strong> مجموع المبالغ المحصلة</li>
      </ul>
    `
  },
  {
    id: 'new-booking-button',
    attachTo: { element: '#tour-new-booking-btn', on: 'auto' },
    title: '➕ إنشاء حجز جديد',
    text: `
      <p>اضغط هنا لإنشاء حجز جديد بسرعة.</p>
      <p class="mt-2 text-sm text-gray-500">سيتم نقلك إلى صفحة إنشاء الحجوزات</p>
    `
  },
  {
    id: 'sidebar-nav',
    attachTo: { element: '#tour-sidebar-nav', on: 'auto' },
    title: '📋 القائمة الجانبية',
    text: `
      <p>من هنا يمكنك التنقل بين صفحات النظام:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>التقويم:</strong> عرض الحجوزات على التقويم</li>
        <li><strong>الحجوزات:</strong> إدارة جميع الحجوزات</li>
        <li><strong>القاعات:</strong> إعداد القاعات والأسعار</li>
        <li><strong>المالية:</strong> الفواتير والمدفوعات</li>
      </ul>
    `
  }
]
