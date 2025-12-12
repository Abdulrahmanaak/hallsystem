import { Booking } from "./booking";

export interface QoyodStatus {
    connected: boolean;
    lastSync: string | null;
    apiKey: string | null;
}

export const qoyodService = {
    getStatus: async (): Promise<QoyodStatus> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const apiKey = typeof window !== 'undefined' ? localStorage.getItem('qoyod_api_key') : null;
        return {
            connected: !!apiKey,
            apiKey,
            lastSync: typeof window !== 'undefined' ? localStorage.getItem('qoyod_last_sync') : null,
        };
    },

    setApiKey: async (key: string): Promise<void> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (typeof window !== 'undefined') {
            localStorage.setItem('qoyod_api_key', key);
        }
    },

    createInvoice: async (booking: Booking): Promise<{ success: boolean; invoiceId?: string; message?: string }> => {
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const apiKey = typeof window !== 'undefined' ? localStorage.getItem('qoyod_api_key') : null;
        if (!apiKey) {
            return { success: false, message: "Qoyod API Key not found. Please configure it in Settings." };
        }

        // Simulate random success/failure
        const success = Math.random() > 0.1; // 90% success rate

        if (success) {
            if (typeof window !== 'undefined') {
                localStorage.setItem('qoyod_last_sync', new Date().toISOString());
            }
            return { success: true, invoiceId: `INV-${Math.floor(Math.random() * 10000)}` };
        } else {
            return { success: false, message: "Network error connecting to Qoyod API." };
        }
    }
};
