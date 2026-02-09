'use client'

import React, { createContext, useContext } from 'react'
import type { UserRole } from '@/types/enums'

interface User {
    nameAr: string
    role: UserRole
    id?: string
    ownerId?: string
}

const UserContext = createContext<User | null>(null)

export function UserProvider({ children, user }: { children: React.ReactNode, user: User }) {
    return (
        <UserContext.Provider value={user}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext)
    if (!context) {
        throw new Error('useUser must be used within a UserProvider')
    }
    return context
}
