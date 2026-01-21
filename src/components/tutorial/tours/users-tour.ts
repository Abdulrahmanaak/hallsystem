// Users Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const USERS_TOUR_ID = 'users-tour'

export const usersTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '👥 إدارة المستخدمين',
    text: `
      <p>مرحباً بك في صفحة إدارة المستخدمين!</p>
      <p class="mt-2">هنا يمكنك إضافة وإدارة مستخدمي النظام وصلاحياتهم.</p>
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
    id: 'add-user',

    title: '➕ إضافة مستخدم',
    text: `
      <p>اضغط لإضافة مستخدم جديد.</p>
      <p class="mt-2 text-sm text-gray-500">حدد اسم المستخدم وكلمة المرور والدور</p>
    `
  },
  {
    id: 'roles',
    title: '🎭 الأدوار والصلاحيات',
    text: `
      <p>أدوار المستخدمين:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">

        <li><strong>صاحب قاعة:</strong> إدارة القاعات والموظفين</li>
        <li><strong>مشرف:</strong> إدارة الحجوزات اليومية</li>
        <li><strong>محاسب:</strong> الفواتير والمالية فقط</li>
        <li><strong>موظف:</strong> وصول محدود</li>
      </ul>
    `
  },
  {
    id: 'status',

    title: '✅ حالة المستخدم',
    text: `
      <p>يمكنك تفعيل أو تعطيل المستخدم:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><span class="text-green-600">●</span> نشط: يمكنه الدخول</li>
        <li><span class="text-red-600">●</span> غير نشط: ممنوع من الدخول</li>
      </ul>
    `
  }
]
