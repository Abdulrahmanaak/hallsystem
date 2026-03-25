import pino from 'pino'

const logger = pino({
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    ...(process.env.NODE_ENV !== 'production' && {
        transport: {
            target: 'pino/file',
            options: { destination: 1 } // stdout
        }
    })
})

export default logger

/**
 * Create a child logger with tenant context.
 */
export function createTenantLogger(context: { ownerId?: string | null; userId?: string; module: string }) {
    return logger.child({
        module: context.module,
        ...(context.ownerId && { ownerId: context.ownerId }),
        ...(context.userId && { userId: context.userId }),
    })
}
