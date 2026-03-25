import { describe, it, expect, beforeAll } from 'vitest'
import { encrypt, decrypt, isEncrypted } from '../encryption'

describe('encryption', () => {
    beforeAll(() => {
        // Set a test encryption key (32 bytes = 64 hex chars)
        process.env.ENCRYPTION_KEY = 'a'.repeat(64)
    })

    it('encrypts and decrypts round-trip', () => {
        const plaintext = 'my-secret-api-key-12345'
        const encrypted = encrypt(plaintext)
        const decrypted = decrypt(encrypted)
        expect(decrypted).toBe(plaintext)
    })

    it('produces different ciphertexts for same input (random IV)', () => {
        const plaintext = 'same-input'
        const a = encrypt(plaintext)
        const b = encrypt(plaintext)
        expect(a).not.toBe(b)
    })

    it('isEncrypted detects encrypted strings', () => {
        const encrypted = encrypt('test')
        expect(isEncrypted(encrypted)).toBe(true)
    })

    it('isEncrypted returns false for plaintext', () => {
        expect(isEncrypted('just-a-plain-api-key')).toBe(false)
        expect(isEncrypted('')).toBe(false)
        expect(isEncrypted('abc:def')).toBe(false)
    })

    it('decrypt fails with tampered data', () => {
        const encrypted = encrypt('test')
        const parts = encrypted.split(':')
        parts[2] = 'ff' + parts[2].slice(2) // tamper with ciphertext
        expect(() => decrypt(parts.join(':'))).toThrow()
    })

    it('handles unicode content', () => {
        const plaintext = 'مفتاح-سري-عربي'
        const encrypted = encrypt(plaintext)
        expect(decrypt(encrypted)).toBe(plaintext)
    })
})
