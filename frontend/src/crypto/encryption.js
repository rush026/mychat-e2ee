/**
 * Message Encryption/Decryption Module.
 *
 * Uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption.
 *
 * SECURITY PROPERTIES:
 * - Confidentiality: AES-256 symmetric encryption
 * - Integrity: GCM mode includes authentication tag (AEAD)
 * - Uniqueness: Fresh 12-byte IV generated for every message
 * - Non-malleability: Any tampering is detected and decryption fails
 *
 * IV/NONCE MANAGEMENT:
 * - 12 bytes (96 bits) — the recommended size for AES-GCM
 * - Generated using crypto.getRandomValues() (CSPRNG)
 * - MUST be unique for every encryption with the same key
 * - Stored alongside the ciphertext (IV is not secret, only unique)
 * - With random 96-bit IVs, collision probability is negligible
 *   for practical message volumes (birthday bound ~2^48 messages per key)
 */

/**
 * Encrypt a plaintext message using AES-256-GCM.
 *
 * @param {string} plaintext - The message to encrypt
 * @param {CryptoKey} key - AES-256-GCM key (from HKDF derivation)
 * @returns {Promise<{ciphertext: string, iv: string}>} Base64-encoded ciphertext and IV
 */
export const encryptMessage = async (plaintext, key) => {
  // Generate a fresh 12-byte IV for this message
  // CRITICAL: Must be unique for every encryption with the same key
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode the plaintext as UTF-8 bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Encrypt using AES-256-GCM
  // The output includes the ciphertext + 128-bit authentication tag
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      // tagLength: 128 is the default — 128-bit authentication tag
    },
    key,
    plaintextBytes
  );

  // Convert to base64 for transmission/storage
  return {
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
    iv: arrayBufferToBase64(iv.buffer),
  };
};

/**
 * Decrypt a ciphertext message using AES-256-GCM.
 *
 * @param {string} ciphertextBase64 - Base64-encoded ciphertext
 * @param {string} ivBase64 - Base64-encoded IV
 * @param {CryptoKey} key - AES-256-GCM key (same key used for encryption)
 * @returns {Promise<string>} Decrypted plaintext
 * @throws {Error} If decryption fails (wrong key, tampered data, or wrong IV)
 */
export const decryptMessage = async (ciphertextBase64, ivBase64, key) => {
  const ciphertextBuffer = base64ToArrayBuffer(ciphertextBase64);
  const iv = base64ToArrayBuffer(ivBase64);

  // Decrypt and verify authentication tag
  // If the ciphertext was tampered with, this will throw an OperationError
  const plaintextBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv),
    },
    key,
    ciphertextBuffer
  );

  // Decode UTF-8 bytes back to string
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
};

// ─── Encoding utilities ─────────────────────────────────────────────

/**
 * Convert an ArrayBuffer to a base64 string.
 */
export const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

/**
 * Convert a base64 string to an ArrayBuffer.
 */
export const base64ToArrayBuffer = (base64) => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};
