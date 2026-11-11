import crypto from 'crypto'

// Server-side AES-256-GCM encryption and decryption.
// Compatible with Python's cryptography.hazmat.primitives.ciphers.aead.AESGCM.

function getSecretKey(customSecret?: string): Buffer {
  const secret =
    customSecret ||
    process.env.ACTS_ENCRYPTION_SECRET ||
    process.env.NEXT_PUBLIC_ACTS_ENCRYPTION_SECRET ||
    'acts-default-cloud-trading-secret-key-32'
  return crypto.createHash('sha256').update(secret.trim()).digest()
}

// Encrypts a plaintext string into a self-contained base64 string:
// base64(12-byte IV + ciphertext + 16-byte auth tag).
export function encryptCredential(plaintext: string, customSecret?: string): string {
  if (!plaintext) return ''
  const key = getSecretKey(customSecret)
  const iv = crypto.randomBytes(12) // Standard 96-bit nonce
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, ciphertext, tag]).toString('base64')
}

// Decrypts a self-contained base64 string produced by either Node.js or Python.
export function decryptCredential(payloadBase64: string, customSecret?: string): string {
  if (!payloadBase64) return ''
  const key = getSecretKey(customSecret)
  const buf = Buffer.from(payloadBase64, 'base64')

  if (buf.length < 28) {
    throw new Error('Invalid encrypted payload: insufficient bytes.')
  }

  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(buf.length - 16)
  const ciphertext = buf.subarray(12, buf.length - 16)

  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)

  return decipher.update(ciphertext, undefined, 'utf8') + decipher.final('utf8')
}

// Masks an API key for safe public UI display (e.g. eabc****2dsa).
export function maskApiKey(apiKey: string): string {
  const cleaned = (apiKey || '').trim()
  if (cleaned.length <= 8) return '****'
  return `${cleaned.slice(0, 4)}****${cleaned.slice(-4)}`
}
