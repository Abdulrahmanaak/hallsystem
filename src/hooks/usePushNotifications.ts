'use client'

import { useState, useEffect, useCallback } from 'react'

type PermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
    const [permission, setPermission] = useState<PermissionState>('default')
    const [isSubscribed, setIsSubscribed] = useState(false)

    useEffect(() => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setPermission('unsupported')
            return
        }

        setPermission(Notification.permission as PermissionState)

        // Check if already subscribed
        navigator.serviceWorker.ready.then((registration) => {
            registration.pushManager.getSubscription().then((sub) => {
                setIsSubscribed(!!sub)
            })
        })
    }, [])

    // Register service worker
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('[SW] Registration failed:', err)
            })
        }
    }, [])

    const requestPermission = useCallback(async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return false
        }

        try {
            const result = await Notification.requestPermission()
            setPermission(result as PermissionState)

            if (result !== 'granted') return false

            const registration = await navigator.serviceWorker.ready
            const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

            if (!vapidPublicKey) {
                console.error('[PUSH] VAPID public key not configured')
                return false
            }

            // Convert VAPID key to Uint8Array
            const urlBase64ToUint8Array = (base64String: string) => {
                const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
                const base64 = (base64String + padding)
                    .replace(/-/g, '+')
                    .replace(/_/g, '/')
                const rawData = window.atob(base64)
                const outputArray = new Uint8Array(rawData.length)
                for (let i = 0; i < rawData.length; ++i) {
                    outputArray[i] = rawData.charCodeAt(i)
                }
                return outputArray
            }

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
            })

            // Send subscription to backend
            const res = await fetch('/api/notifications/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: btoa(
                            String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
                        ),
                        auth: btoa(
                            String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
                        ),
                    },
                    userAgent: navigator.userAgent,
                }),
            })

            if (res.ok) {
                setIsSubscribed(true)
                return true
            }

            return false
        } catch (err) {
            console.error('[PUSH] Subscription error:', err)
            return false
        }
    }, [])

    const unsubscribe = useCallback(async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()

            if (subscription) {
                await fetch('/api/notifications/subscribe', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                })

                await subscription.unsubscribe()
                setIsSubscribed(false)
            }
        } catch (err) {
            console.error('[PUSH] Unsubscribe error:', err)
        }
    }, [])

    return {
        permission,
        isSubscribed,
        requestPermission,
        unsubscribe,
        isSupported: permission !== 'unsupported',
    }
}
