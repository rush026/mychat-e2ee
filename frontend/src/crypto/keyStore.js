/**
 * IndexedDB Key Store for E2EE.
 *
 * SECURITY ARCHITECTURE:
 * - Private keys are stored as non-extractable CryptoKey objects in IndexedDB
 * - Non-extractable means even JavaScript code cannot read the raw key bytes
 * - Keys are bound to the origin (same-origin policy)
 * - This is the most secure client-side storage available in browsers
 *
 * The store manages:
 * - Identity key pairs (ECDH P-256)
 * - Derived conversation keys (AES-256-GCM, cached)
 */

const DB_NAME = 'mychat-keystore';
const DB_VERSION = 1;
const STORE_KEYS = 'keys';
const STORE_CONV_KEYS = 'conversationKeys';

/**
 * Open the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store for identity keys
      if (!db.objectStoreNames.contains(STORE_KEYS)) {
        db.createObjectStore(STORE_KEYS, { keyPath: 'id' });
      }

      // Store for derived conversation keys (cached)
      if (!db.objectStoreNames.contains(STORE_CONV_KEYS)) {
        db.createObjectStore(STORE_CONV_KEYS, { keyPath: 'conversationId' });
      }
    };
  });
};

/**
 * Store a key pair in IndexedDB.
 * @param {string} userId - The user's ID
 * @param {CryptoKey} privateKey - Non-extractable ECDH private key
 * @param {CryptoKey} publicKey - Extractable ECDH public key
 * @param {number} keyVersion
 */
export const storeKeyPair = async (userId, privateKey, publicKey, keyVersion = 1) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KEYS, 'readwrite');
    const store = tx.objectStore(STORE_KEYS);

    store.put({
      id: `identity:${userId}`,
      privateKey,
      publicKey,
      keyVersion,
      createdAt: new Date().toISOString(),
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Retrieve the identity key pair for a user.
 * @param {string} userId
 * @returns {Promise<{privateKey: CryptoKey, publicKey: CryptoKey, keyVersion: number} | null>}
 */
export const getKeyPair = async (userId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KEYS, 'readonly');
    const store = tx.objectStore(STORE_KEYS);
    const request = store.get(`identity:${userId}`);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Store a derived conversation key.
 * @param {string} conversationId
 * @param {CryptoKey} derivedKey - AES-256-GCM key
 * @param {number} keyVersion
 */
export const storeConversationKey = async (conversationId, derivedKey, keyVersion) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONV_KEYS, 'readwrite');
    const store = tx.objectStore(STORE_CONV_KEYS);

    store.put({
      conversationId,
      derivedKey,
      keyVersion,
      cachedAt: new Date().toISOString(),
    });

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Retrieve a cached conversation key.
 * @param {string} conversationId
 * @returns {Promise<{derivedKey: CryptoKey, keyVersion: number} | null>}
 */
export const getConversationKey = async (conversationId) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONV_KEYS, 'readonly');
    const store = tx.objectStore(STORE_CONV_KEYS);
    const request = store.get(conversationId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clear all conversation key caches (e.g., on key rotation).
 */
export const clearConversationKeys = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CONV_KEYS, 'readwrite');
    const store = tx.objectStore(STORE_CONV_KEYS);
    store.clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Clear all keys (e.g., on logout).
 */
export const clearAllKeys = async () => {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_KEYS, STORE_CONV_KEYS], 'readwrite');
    tx.objectStore(STORE_KEYS).clear();
    tx.objectStore(STORE_CONV_KEYS).clear();

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
