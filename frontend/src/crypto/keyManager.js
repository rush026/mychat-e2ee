import { storeKeyPair, getKeyPair, getConversationKey, storeConversationKey, clearAllKeys } from './keyStore.js';
import { deriveConversationKey, importPublicKey } from './keyExchange.js';
import { encryptMessage, decryptMessage } from './encryption.js';
import { userService } from '../services/user.service.js';

/**
 * Key Manager — high-level API for E2EE operations.
 *
 * This module orchestrates:
 * 1. Identity key pair generation and storage
 * 2. Public key upload to server
 * 3. Conversation key derivation and caching
 * 4. Message encryption and decryption
 *
 * ARCHITECTURE:
 * ┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
 * │ Key Manager │────▶│ Key Exchange │────▶│   Encryption    │
 * │  (this)     │     │ (ECDH+HKDF)  │     │ (AES-256-GCM)   │
 * └──────┬──────┘     └──────────────┘     └─────────────────┘
 *        │
 *        ▼
 * ┌──────────────┐
 * │  Key Store   │
 * │ (IndexedDB)  │
 * └──────────────┘
 */

// In-memory cache for conversation keys (CryptoKey objects)
const conversationKeyCache = new Map();

/**
 * Generate a new ECDH P-256 identity key pair.
 *
 * SECURITY:
 * - Private key is generated with extractable=false
 *   This means the raw key bytes CANNOT be read by JavaScript
 *   It can only be used via the Web Crypto API operations
 * - The key pair is stored in IndexedDB
 * - The public key is exported as JWK for upload to server
 *
 * @param {string} userId
 * @returns {Promise<{publicKeyJwk: Object, keyVersion: number}>}
 */
export const generateIdentityKeys = async (userId) => {
  // Generate ECDH P-256 key pair
  // extractable: false for private key prevents JS-level extraction
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    false, // NOT extractable — private key cannot be read
    ['deriveBits'] // Only used for ECDH key agreement
  );

  // Export public key as JWK for server storage
  const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);

  // Store in IndexedDB
  const keyVersion = 1;
  await storeKeyPair(userId, keyPair.privateKey, keyPair.publicKey, keyVersion);

  return { publicKeyJwk, keyVersion };
};

/**
 * Initialize keys for a user.
 * Generates new keys if none exist, or returns existing ones.
 *
 * @param {string} userId
 * @returns {Promise<{publicKeyJwk: Object, keyVersion: number, isNew: boolean}>}
 */
export const initializeKeys = async (userId) => {
  const existing = await getKeyPair(userId);

  if (existing) {
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', existing.publicKey);
    return { publicKeyJwk, keyVersion: existing.keyVersion, isNew: false };
  }

  const result = await generateIdentityKeys(userId);
  return { ...result, isNew: true };
};

/**
 * Upload the public key to the server.
 * Called after key generation.
 */
export const uploadPublicKey = async (publicKeyJwk) => {
  await userService.updatePublicKey(publicKeyJwk);
};

/**
 * Get or derive the conversation encryption key.
 *
 * Flow:
 * 1. Check in-memory cache
 * 2. Check IndexedDB cache
 * 3. If not cached, derive from ECDH:
 *    a. Get our private key from IndexedDB
 *    b. Fetch peer's public key from server (or use provided)
 *    c. ECDH deriveBits → HKDF → AES-256-GCM key
 *    d. Cache the result
 *
 * @param {string} conversationId
 * @param {string} myUserId
 * @param {Object} peerPublicKeyJwk - Peer's public key in JWK format
 * @returns {Promise<CryptoKey>} AES-256-GCM key
 */
export const getOrDeriveConversationKey = async (conversationId, myUserId, peerPublicKeyJwk) => {
  // Check memory cache first
  const cached = conversationKeyCache.get(conversationId);
  if (cached) return cached;

  // Check IndexedDB cache
  const stored = await getConversationKey(conversationId);
  if (stored) {
    conversationKeyCache.set(conversationId, stored.derivedKey);
    return stored.derivedKey;
  }

  // Need to derive — get our private key
  const myKeys = await getKeyPair(myUserId);
  if (!myKeys) {
    throw new Error('Identity keys not found. Please re-login.');
  }

  // Import peer's public key from JWK
  const peerPublicKey = await importPublicKey(peerPublicKeyJwk);

  // Derive the AES-256-GCM key via ECDH + HKDF
  const derivedKey = await deriveConversationKey(
    myKeys.privateKey,
    peerPublicKey,
    conversationId
  );

  // Cache in memory and IndexedDB
  conversationKeyCache.set(conversationId, derivedKey);
  await storeConversationKey(conversationId, derivedKey, myKeys.keyVersion);

  return derivedKey;
};

/**
 * Encrypt a message for a conversation.
 *
 * @param {string} plaintext - The plaintext message
 * @param {string} conversationId
 * @param {string} myUserId
 * @param {Object} peerPublicKeyJwk
 * @returns {Promise<{encryptedPayload: string, iv: string, keyVersion: number}>}
 */
export const encryptForConversation = async (plaintext, conversationId, myUserId, peerPublicKeyJwk) => {
  const key = await getOrDeriveConversationKey(conversationId, myUserId, peerPublicKeyJwk);

  const { ciphertext, iv } = await encryptMessage(plaintext, key);

  const myKeys = await getKeyPair(myUserId);

  return {
    encryptedPayload: ciphertext,
    iv,
    keyVersion: myKeys?.keyVersion || 1,
  };
};

/**
 * Decrypt a message from a conversation.
 *
 * @param {string} encryptedPayload - Base64-encoded ciphertext
 * @param {string} iv - Base64-encoded IV
 * @param {string} conversationId
 * @param {string} myUserId
 * @param {Object} peerPublicKeyJwk
 * @returns {Promise<string>} Decrypted plaintext
 */
export const decryptFromConversation = async (encryptedPayload, iv, conversationId, myUserId, peerPublicKeyJwk) => {
  const key = await getOrDeriveConversationKey(conversationId, myUserId, peerPublicKeyJwk);

  return decryptMessage(encryptedPayload, iv, key);
};

/**
 * Clear all cached keys (call on logout).
 */
export const clearKeys = async () => {
  conversationKeyCache.clear();
  await clearAllKeys();
};
