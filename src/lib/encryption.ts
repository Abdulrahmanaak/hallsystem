import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY
    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required')
    }
    // Accept hex-encoded 32-byte key (64 hex chars) or raw 32-byte string
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
        return Buffer.from(key, 'hex')
    }
    if (key.length === 32) {
        return Buffer.from(key, 'utf-8')
    }
    throw new Error('ENCRYPTION_KEY must be 32 bytes (or 64 hex characters)')
}

/**
 * Encrypt plaintext using AES-256-GCM.
 * Returns format: iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(plaintext, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

/**
 * Decrypt a string encrypted by encrypt().
 */
export function decrypt(encrypted: string): string {
    const key = getEncryptionKey()
    const parts = encrypted.split(':')

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted format')
    }

    const [ivHex, authTagHex, ciphertext] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
        throw new Error('Invalid encrypted format')
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
}

/**
 * Check if a string looks like it was encrypted by encrypt() (vs plaintext).
 */
export function isEncrypted(value: string): boolean {
    const parts = value.split(':')
    if (parts.length !== 3) return false
    // IV should be 24 hex chars (12 bytes), auth tag 32 hex chars (16 bytes)
    return parts[0].length === 24 && parts[1].length === 32 && /^[0-9a-fA-F:]+$/.test(value)
}
