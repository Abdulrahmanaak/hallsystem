// Settings Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const SETTINGS_TOUR_ID = 'settings-tour'

export const settingsTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '⚙️ الإعدادات',
    text: `
      <p>مرحباً بك في صفحة الإعدادات!</p>
      <p class="mt-2">هنا يمكنك تكوين بيانات المؤسسة والتكامل مع قيود.</p>
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
    id: 'company-info',

    title: '🏢 بيانات المؤسسة',
    text: `
      <p>أدخل بيانات المؤسسة:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>اسم المؤسسة</li>
        <li>الهاتف والبريد الإلكتروني</li>
        <li>العنوان</li>
        <li>السجل التجاري والرقم الضريبي</li>
      </ul>
    `
  },
  {
    id: 'vat',

    title: '💵 ضريبة القيمة المضافة',
    text: `
      <p>حدد نسبة الضريبة المطبقة.</p>
      <p class="mt-2 text-sm text-gray-500">النسبة الافتراضية: 15%</p>
    `
  },
  {
    id: 'qoyod-toggle',

    title: '🔗 تفعيل قيود',
    text: `
      <p>فعّل التكامل مع قيود المحاسبي.</p>
      <p class="mt-2 text-sm text-gray-500">يتطلب مفتاح API صالح</p>
    `
  },
  {
    id: 'qoyod-api',

    title: '🔑 مفتاح API',
    text: `
      <p>أدخل مفتاح API من قيود:</p>
      <ol class="mt-2 mr-4 list-decimal text-sm">
        <li>سجل دخولك في قيود</li>
        <li>اذهب للإعدادات > API</li>
        <li>انسخ المفتاح والصقه هنا</li>
      </ol>
      <p class="mt-2 text-sm text-gray-500">اضغط "اختبار الاتصال" للتحقق</p>
    `
  }
]
