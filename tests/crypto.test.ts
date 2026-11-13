import { describe, it, expect } from 'vitest';
import { encryptToken, decryptToken, generateIdempotentKey } from '../src/lib/crypto';

describe('Cryptographic Security & AES-256-GCM', () => {
  it('should encrypt and decrypt access tokens correctly', () => {
    const rawToken = 'EAABsbCS1iHgBAO7...mock_meta_long_lived_token_xyz123';
    const encrypted = encryptToken(rawToken);

    expect(encrypted.encryptedText).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.encryptedText).not.toBe(rawToken);

    const decrypted = decryptToken(
      encrypted.encryptedText,
      encrypted.iv,
      encrypted.authTag
    );

    expect(decrypted).toBe(rawToken);
  });

  it('should fail decryption if ciphertext is tampered with', () => {
    const rawToken = 'super_secret_oauth_token';
    const encrypted = encryptToken(rawToken);

    // Tamper with encrypted text
    const tampered = 'A' + encrypted.encryptedText.substring(1);

    expect(() => {
      decryptToken(tampered, encrypted.iv, encrypted.authTag);
    }).toThrow();
  });

  it('should fail decryption if auth tag is tampered with', () => {
    const rawToken = 'super_secret_oauth_token';
    const encrypted = encryptToken(rawToken);

    // Tamper with auth tag
    const tamperedTag = 'B' + encrypted.authTag.substring(1);

    expect(() => {
      decryptToken(encrypted.encryptedText, encrypted.iv, tamperedTag);
    }).toThrow();
  });

  it('should generate consistent idempotent keys within the same time window', () => {
    const postId = 'post-123';
    const destinationId = 'dest-456';
    const t1 = 1731500000000;
    const t2 = 1731500000000 + 30000; // 30s later (within 5min bucket)

    const key1 = generateIdempotentKey(postId, destinationId, t1);
    const key2 = generateIdempotentKey(postId, destinationId, t2);

    expect(key1).toBe(key2);
  });
});
