'use client'

import { useState, useEffect, useCallback } from 'react'

interface Notification {
    id: string
    type: string
    title: string
    message: string
    metadata: string | null
    link: string | null
    isRead: boolean
    readAt: string | null
    createdAt: string
}

interface NotificationsResponse {
    items: Notification[]
    nextCursor: string | null
    hasMore: boolean
}

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [hasMore, setHasMore] = useState(false)
    const [nextCursor, setNextCursor] = useState<string | null>(null)

    // Fetch notifications
    const fetchNotifications = useCallback(async (cursor?: string) => {
        try {
            const params = new URLSearchParams()
            if (cursor) params.set('cursor', cursor)
            params.set('limit', '20')

            const res = await fetch(`/api/notifications?${params}`)
            if (!res.ok) return

            const data: NotificationsResponse = await res.json()

            if (cursor) {
                setNotifications((prev) => [...prev, ...data.items])
            } else {
                setNotifications(data.items)
            }
            setNextCursor(data.nextCursor)
            setHasMore(data.hasMore)
        } catch (err) {
            console.error('[useNotifications] fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch unread count
    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications/count')
            if (!res.ok) return

            const data = await res.json()
            setUnreadCount(data.count)
        } catch (err) {
            console.error('[useNotifications] count error:', err)
        }
    }, [])

    // Mark one as read
    const markAsRead = useCallback(async (id: string) => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))

        try {
            await fetch('/api/notifications/read', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            })
        } catch (err) {
            console.error('[useNotifications] markAsRead error:', err)
            // Revert on failure
            fetchNotifications()
            fetchUnreadCount()
        }
    }, [fetchNotifications, fetchUnreadCount])

    // Mark all as read
    const markAllAsRead = useCallback(async () => {
        // Optimistic update
        setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        )
        setUnreadCount(0)

        try {
            await fetch('/api/notifications/read-all', {
                method: 'PATCH',
            })
        } catch (err) {
            console.error('[useNotifications] markAllAsRead error:', err)
            fetchNotifications()
            fetchUnreadCount()
        }
    }, [fetchNotifications, fetchUnreadCount])

    // Load more (pagination)
    const loadMore = useCallback(() => {
        if (nextCursor && hasMore) {
            fetchNotifications(nextCursor)
        }
    }, [nextCursor, hasMore, fetchNotifications])

    // Initial fetch + polling
    useEffect(() => {
        fetchNotifications()
        fetchUnreadCount()

        // Poll unread count every 30s
        const countInterval = setInterval(fetchUnreadCount, 30000)
        // Refresh notifications every 60s
        const notifInterval = setInterval(() => fetchNotifications(), 60000)

        return () => {
            clearInterval(countInterval)
            clearInterval(notifInterval)
        }
    }, [fetchNotifications, fetchUnreadCount])

    return {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        markAsRead,
        markAllAsRead,
        loadMore,
        refresh: () => {
            fetchNotifications()
            fetchUnreadCount()
        },
    }
}
