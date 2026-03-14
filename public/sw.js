// Service Worker for Push Notifications
// Hall Management System

self.addEventListener('push', function (event) {
    if (!event.data) return

    const data = event.data.json()

    const options = {
        body: data.body || '',
        icon: data.icon || '/icon-192.png',
        badge: '/icon-72.png',
        dir: 'rtl',
        lang: 'ar',
        data: {
            url: data.url || '/dashboard',
        },
        actions: [
            {
                action: 'open',
                title: 'عرض',
            },
            {
                action: 'dismiss',
                title: 'إغلاق',
            },
        ],
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'إشعار جديد', options)
    )
})

self.addEventListener('notificationclick', function (event) {
    event.notification.close()

    if (event.action === 'dismiss') return

    const url = event.notification.data?.url || '/dashboard'

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If a window is already open, focus it and navigate
            for (const client of clientList) {
                if (client.url.includes('/dashboard') && 'focus' in client) {
                    client.focus()
                    client.navigate(url)
                    return
                }
            }
            // Otherwise open a new window
            if (clients.openWindow) {
                return clients.openWindow(url)
            }
        })
    )
})
