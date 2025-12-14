import type { User, Role } from '@/types';

const MOCK_USERS: any[] = [
    {
        id: '1',
        username: 'admin',
        password: 'password',
        nameAr: 'Admin User',
        email: 'admin@hall.com',
        phone: '1234567890',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
    },
    {
        id: '2',
        username: 'supervisor',
        password: 'password',
        nameAr: 'Supervisor User',
        email: 'supervisor@hall.com',
        phone: '1234567890',
        role: 'ROOM_SUPERVISOR',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
    },
    {
        id: '3',
        username: 'accountant',
        password: 'password',
        nameAr: 'Accountant User',
        email: 'accountant@hall.com',
        phone: '1234567890',
        role: 'ACCOUNTANT',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
    },
    {
        id: '4',
        username: 'employee',
        password: 'password',
        nameAr: 'Employee User',
        email: 'employee@hall.com',
        phone: '1234567890',
        role: 'EMPLOYEE',
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
    },
];

export const authService = {
    login: async (role: Role): Promise<User> => {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        const user = MOCK_USERS.find((u) => u.role === role);
        if (!user) throw new Error('User not found');

        // In a real app, we'd set a cookie/token here
        if (typeof window !== 'undefined') {
            localStorage.setItem('hall_user', JSON.stringify(user));
        }

        return user;
    },

    logout: async (): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (typeof window !== 'undefined') {
            localStorage.removeItem('hall_user');
        }
    },

    getCurrentUser: (): User | null => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('hall_user');
            if (stored) return JSON.parse(stored);
        }
        return null;
    },
};
