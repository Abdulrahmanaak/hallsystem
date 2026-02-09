import { useSubscription as useSubscriptionContext } from '@/providers/SubscriptionProvider'

export function useSubscription() {
    return useSubscriptionContext()
}
