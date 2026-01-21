// Finance Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const FINANCE_TOUR_ID = 'finance-tour'

export const financeTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '💰 المالية',
    text: `
      <p>مرحباً بك في صفحة المالية!</p>
      <p class="mt-2">هنا يمكنك إدارة الفواتير والمدفوعات ومزامنتها مع قيود.</p>
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
    id: 'stats',
    attachTo: { element: '#tour-finance-stats', on: 'auto' },
    title: '📊 ملخص مالي',
    text: `
      <p>الإحصائيات المالية:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>إجمالي الفواتير:</strong> قيمة جميع الفواتير</li>
        <li><strong>المحصل:</strong> المبالغ المدفوعة</li>
        <li><strong>المتبقي:</strong> المبالغ غير المدفوعة</li>
      </ul>
    `
  },
  {
    id: 'create-invoice',
    attachTo: { element: '#tour-create-invoice-btn', on: 'auto' },
    title: '📄 إصدار فاتورة',
    text: `
      <p>اضغط لإصدار فاتورة جديدة.</p>
      <p class="mt-2 text-sm text-gray-500">اختر الحجز وحدد طريقة الدفع</p>
    `
  },
  {
    id: 'invoice-table',
    attachTo: { element: '#tour-invoice-table', on: 'auto' },
    title: '📋 قائمة الفواتير',
    text: `
      <p>جدول الفواتير يعرض:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>رقم الفاتورة وتاريخ الإصدار</li>
        <li>اسم العميل والقاعة</li>
        <li>المبلغ والحالة (مدفوعة/غير مدفوعة)</li>
        <li>حالة المزامنة مع قيود</li>
      </ul>
    `
  },
  {
    id: 'qoyod-sync',
    attachTo: { element: '#tour-invoice-table', on: 'auto' },
    title: '🔗 مزامنة قيود',
    text: `
      <p>تكامل قيود المحاسبي:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>مزامنة:</strong> إرسال الفاتورة لقيود</li>
        <li><strong>تحقق:</strong> التأكد من حالة المزامنة</li>
        <li><strong>حذف:</strong> حذف من قيود (للمسودات)</li>
      </ul>
    `
  },
  {
    id: 'print',
    attachTo: { element: '#tour-invoice-table', on: 'auto' },
    title: '🖨️ طباعة',
    text: `
      <p>يمكنك طباعة:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>الفاتورة:</strong> نسخة رسمية للعميل</li>
        <li><strong>سند القبض:</strong> إثبات الدفع</li>
      </ul>
    `
  }
]
