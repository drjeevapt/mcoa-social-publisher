import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV for AES-GCM

/**
 * Returns the 32-byte encryption key from environment variable
 * or generates a deterministic fallback for local development with a warning.
 */
function getEncryptionKey(): Buffer {
  const envKey = process.env.ENCRYPTION_KEY;
  if (envKey) {
    if (envKey.length === 64) {
      // 32-byte key hex-encoded
      return Buffer.from(envKey, 'hex');
    }
    if (envKey.length === 32) {
      return Buffer.from(envKey, 'utf8');
    }
    // Hash it to ensure exactly 32 bytes
    return crypto.createHash('sha256').update(envKey).digest();
  }

  // Development warning
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: ENCRYPTION_KEY environment variable is not set in production!');
  }

  // Deterministic fallback for dev/testing only
  return crypto.createHash('sha256').update('mcoa-social-publisher-dev-secret-key-2026').digest();
}

export interface EncryptedData {
  encryptedText: string; // Base64
  iv: string;            // Base64
  authTag: string;       // Base64
}

/**
 * Encrypts a plaintext string (e.g. access token) using AES-256-GCM
 */
export function encryptToken(plainText: string): EncryptedData {
  if (!plainText) {
    throw new Error('Cannot encrypt empty text');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    encryptedText: encrypted,
    iv: iv.toString('base64'),
    authTag: authTag,
  };
}

/**
 * Decrypts encrypted text back to plaintext using AES-256-GCM
 */
export function decryptToken(encryptedText: string, iv: string, authTag: string): string {
  if (!encryptedText || !iv || !authTag) {
    throw new Error('Missing encryption parameters for decryption');
  }

  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64')
  );

  decipher.setAuthTag(Buffer.from(authTag, 'base64'));

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Generates an idempotent deduplication key for post publishing attempts
 */
export function generateIdempotentKey(postId: string, destinationId: string, timestamp: number = Date.now()): string {
  // 5-minute bucket hash to avoid duplicate rapid submissions while allowing distinct scheduled runs
  const timeBucket = Math.floor(timestamp / (5 * 60 * 1000));
  return `${postId}:${destinationId}:${timeBucket}`;
}
