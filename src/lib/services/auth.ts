import { User, Role } from '@/types';

const MOCK_USERS: User[] = [
    {
        id: '1',
        name: 'Admin User',
        email: 'admin@hall.com',
        role: 'ADMIN',
        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
    },
    {
        id: '2',
        name: 'Supervisor User',
        email: 'supervisor@hall.com',
        role: 'ROOM_SUPERVISOR',
        avatar: 'https://ui-avatars.com/api/?name=Supervisor+User&background=random',
    },
    {
        id: '3',
        name: 'Accountant User',
        email: 'accountant@hall.com',
        role: 'ACCOUNTANT',
        avatar: 'https://ui-avatars.com/api/?name=Accountant+User&background=random',
    },
    {
        id: '4',
        name: 'Employee User',
        email: 'employee@hall.com',
        role: 'EMPLOYEE',
        avatar: 'https://ui-avatars.com/api/?name=Employee+User&background=random',
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
