// Expenses Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const EXPENSES_TOUR_ID = 'expenses-tour'

export const expensesTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '💸 المصروفات',
    text: `
      <p>مرحباً بك في صفحة المصروفات!</p>
      <p class="mt-2">هنا يمكنك تسجيل وتتبع جميع مصروفات القاعة.</p>
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
    id: 'add-expense',

    title: '➕ إضافة مصروف',
    text: `
      <p>اضغط لتسجيل مصروف جديد.</p>
      <p class="mt-2 text-sm text-gray-500">أدخل المبلغ والوصف والمورد</p>
    `
  },
  {
    id: 'vendor-select',

    title: '🏪 اختيار المورد',
    text: `
      <p>حدد المورد (البائع) للمصروف:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>يمكنك مزامنة الموردين من قيود</li>
        <li>أو إضافة مورد يدوياً</li>
      </ul>
    `
  },
  {
    id: 'image-upload',

    title: '📷 رفع الصورة',
    text: `
      <p>يمكنك إرفاق صورة الفاتورة أو الإيصال.</p>
      <p class="mt-2 text-sm text-gray-500">الصورة تُخزن للرجوع إليها لاحقاً</p>
    `
  }
]
