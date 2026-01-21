// Calendar Tour Steps
import type { StepOptions, Tour } from 'shepherd.js'

export const CALENDAR_TOUR_ID = 'calendar-tour'

export const calendarTourSteps: StepOptions[] = [
  {
    id: 'welcome',
    title: '📆 التقويم',
    text: `
      <p>مرحباً بك في صفحة التقويم!</p>
      <p class="mt-2">هنا يمكنك عرض جميع الحجوزات على شكل تقويم شهري.</p>
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
    id: 'navigation',

    title: '⬅️ التنقل بين الأشهر',
    text: `
      <p>استخدم الأسهم للتنقل:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li><strong>←</strong> الشهر السابق</li>
        <li><strong>→</strong> الشهر التالي</li>
        <li><strong>اليوم:</strong> العودة للشهر الحالي</li>
      </ul>
    `
  },
  {
    id: 'calendar-grid',

    title: '📅 شبكة التقويم',
    text: `
      <p>كل خلية تمثل يوماً في الشهر:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>اليوم الحالي محدد بلون مميز</li>
        <li>الأيام التي بها حجوزات تظهر مع علامة</li>
        <li>انقر على اليوم لعرض تفاصيل الحجوزات</li>
      </ul>
    `
  },
  {
    id: 'booking-preview',
    title: '👁️ معاينة الحجز',
    text: `
      <p>عند النقر على حجز في التقويم:</p>
      <ul class="mt-2 mr-4 list-disc text-sm">
        <li>تظهر معلومات الحجز الأساسية</li>
        <li>اسم العميل ونوع المناسبة</li>
        <li>رابط مباشر لصفحة تفاصيل الحجز</li>
      </ul>
    `
  }
]
