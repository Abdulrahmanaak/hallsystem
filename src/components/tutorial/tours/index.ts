// Export all tours from a single file
export { DASHBOARD_TOUR_ID, dashboardTourSteps } from './dashboard-tour'
export { BOOKINGS_TOUR_ID, bookingsTourSteps } from './bookings-tour'
export { CALENDAR_TOUR_ID, calendarTourSteps } from './calendar-tour'
export { HALLS_TOUR_ID, hallsTourSteps } from './halls-tour'
export { FINANCE_TOUR_ID, financeTourSteps } from './finance-tour'
export { EXPENSES_TOUR_ID, expensesTourSteps } from './expenses-tour'
export { USERS_TOUR_ID, usersTourSteps } from './users-tour'
export { SETTINGS_TOUR_ID, settingsTourSteps } from './settings-tour'

// Tour metadata for help menu
export const TOUR_METADATA = {
    'dashboard-tour': { name: 'لوحة التحكم', path: '/dashboard' },
    'bookings-tour': { name: 'الحجوزات', path: '/dashboard/bookings' },
    'calendar-tour': { name: 'التقويم', path: '/dashboard/calendar' },
    'halls-tour': { name: 'القاعات', path: '/dashboard/halls' },
    'finance-tour': { name: 'المالية', path: '/dashboard/finance' },
    'expenses-tour': { name: 'المصروفات', path: '/dashboard/expenses' },
    'users-tour': { name: 'المستخدمين', path: '/dashboard/users' },
    'settings-tour': { name: 'الإعدادات', path: '/dashboard/settings' }
} as const
