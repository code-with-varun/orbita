import crypto from 'crypto';

// 32-byte secret derived from environment or fallback
const MASTER_SECRET = process.env.CREDENTIAL_SECRET || process.env.JWT_SECRET || 'orbita_super_secret_master_vault_key_2026';
const DERIVED_KEY = crypto.scryptSync(MASTER_SECRET, 'orbita_cyber_salt_salt', 32);

/**
 * Encrypt a plain-text password using AES-256-GCM.
 * Returns structured crypto data and a formatted cyber code string.
 */
export function encryptPassword(plainText) {
  if (!plainText) return { encrypted: '', iv: '', tag: '', cyberCode: '' };

  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', DERIVED_KEY, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const tag = cipher.getAuthTag().toString('hex');
  const ivHex = iv.toString('hex');
  const cyberCode = `CYBER-ENC:v1:${ivHex}:${tag}:${encrypted}`;

  return {
    encrypted,
    iv: ivHex,
    tag,
    cyberCode
  };
}

/**
 * Decrypt an AES-256-GCM encrypted password.
 * Accepts either (encrypted, iv, tag) or a cyberCode string.
 */
export function decryptPassword(encrypted, ivHex, tagHex, cyberCode) {
  try {
    let enc = encrypted;
    let iv = ivHex;
    let tag = tagHex;

    if (cyberCode && cyberCode.startsWith('CYBER-ENC:v1:')) {
      const parts = cyberCode.split(':');
      if (parts.length === 5) {
        iv = parts[2];
        tag = parts[3];
        enc = parts[4];
      }
    }

    if (!enc || !iv || !tag) {
      return '';
    }

    const decipher = crypto.createDecipheriv('aes-256-gcm', DERIVED_KEY, Buffer.from(iv, 'hex'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(enc, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Decryption error in cryptoUtils:', err.message);
    return '[Decryption Error: Invalid Key or Tampered Cipher]';
  }
}

/**
 * Hash utility for non-reversible indexing or fingerprints
 */
export function hashCyberFingerprint(value) {
  if (!value) return '';
  return crypto.createHash('sha256').update(value + 'orbita_salt').digest('hex').substring(0, 16);
}

