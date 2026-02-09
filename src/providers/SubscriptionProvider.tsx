
'use client'

import React, { createContext, useContext, type ReactNode } from 'react'
import type { SubscriptionState } from '@/lib/subscription'

interface SubscriptionContextType extends SubscriptionState { }

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({
    children,
    value
}: {
    children: ReactNode
    value: SubscriptionState
}) {
    return (
        <SubscriptionContext.Provider value={value}>
            {children}
        </SubscriptionContext.Provider>
    )
}

export function useSubscription() {
    const context = useContext(SubscriptionContext)
    if (context === undefined) {
        throw new Error('useSubscription must be used within a SubscriptionProvider')
    }
    return context
}
