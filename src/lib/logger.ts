let pino: any

try {
    pino = require('pino')
} catch {
    // Fallback if pino is not available at runtime
}

const logger = pino
    ? pino({
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        ...(process.env.NODE_ENV !== 'production' && {
            transport: {
                target: 'pino/file',
                options: { destination: 1 } // stdout
            }
        })
    })
    : console

export default logger

/**
 * Create a child logger with tenant context.
 */
export function createTenantLogger(context: { ownerId?: string | null; userId?: string; module: string }) {
    if (logger.child) {
        return logger.child({
            module: context.module,
            ...(context.ownerId && { ownerId: context.ownerId }),
            ...(context.userId && { userId: context.userId }),
        })
    }
    // Fallback: return console with context prefix
    const prefix = `[${context.module}]`
    return {
        error: (...args: unknown[]) => console.error(prefix, ...args),
        info: (...args: unknown[]) => console.info(prefix, ...args),
        warn: (...args: unknown[]) => console.warn(prefix, ...args),
        debug: (...args: unknown[]) => console.debug(prefix, ...args),
    }
}
