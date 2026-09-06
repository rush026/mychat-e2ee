/**
 * ECDH Key Exchange Module.
 *
 * SECURITY DESIGN:
 * 1. Each user generates an ECDH P-256 key pair on the client
 * 2. Public key is exported as JWK and uploaded to the server
 * 3. Private key stays in IndexedDB as a non-extractable CryptoKey
 * 4. To communicate with another user:
 *    a. Fetch their public key from the server
 *    b. Import it as a CryptoKey
 *    c. Use ECDH deriveBits to compute raw shared secret
 *    d. Feed shared secret into HKDF to derive AES-256-GCM key
 * 5. The derived key is used for symmetric encryption of messages
 *
 * WHY HKDF?
 * - Raw ECDH shared secrets should never be used directly as encryption keys
 * - HKDF (HMAC-based Key Derivation Function) extracts and expands the
 *   shared secret into a key with the correct length and entropy distribution
 * - We use a conversation-specific salt to derive unique keys per conversation
 *
 * FUTURE: This architecture supports adding ephemeral key exchange for
 * Perfect Forward Secrecy — each session could generate a new ephemeral
 * ECDH key pair while keeping the identity key for authentication.
 */

/**
 * Derive a shared AES-256-GCM key from our private key and their public key.
 *
 * Flow: ECDH(ourPrivate, theirPublic) → raw bits → HKDF → AES-256-GCM key
 *
 * @param {CryptoKey} ourPrivateKey - Our ECDH private key (non-extractable)
 * @param {CryptoKey} theirPublicKey - Their ECDH public key (imported from JWK)
 * @param {string} conversationId - Used as HKDF salt for domain separation
 * @returns {Promise<CryptoKey>} AES-256-GCM key for encrypting/decrypting messages
 */
export const deriveConversationKey = async (ourPrivateKey, theirPublicKey, conversationId) => {
  // Step 1: ECDH key agreement — compute raw shared secret
  // This produces 256 bits of shared secret material
  const sharedSecret = await crypto.subtle.deriveBits(
    {
      name: 'ECDH',
      public: theirPublicKey,
    },
    ourPrivateKey,
    256 // P-256 produces 256-bit shared secret
  );

  // Step 2: Import the shared secret as HKDF key material
  // We need to import it before we can use it with deriveKey
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    sharedSecret,
    { name: 'HKDF' },
    false, // not extractable
    ['deriveKey']
  );

  // Step 3: Use HKDF to derive the final AES-256-GCM encryption key
  // - hash: SHA-256 for HMAC
  // - salt: conversation ID ensures different conversations get different keys
  // - info: application context string for domain separation
  const encoder = new TextEncoder();
  const aesKey = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: encoder.encode(`mychat:conv:${conversationId}`),
      info: encoder.encode('mychat-e2ee-message-key-v1'),
    },
    hkdfKey,
    {
      name: 'AES-GCM',
      length: 256, // AES-256
    },
    false, // not extractable — the key cannot be read by JS
    ['encrypt', 'decrypt']
  );

  return aesKey;
};

/**
 * Import a peer's public key from JWK format.
 *
 * @param {Object} jwk - The public key in JWK format from the server
 * @returns {Promise<CryptoKey>}
 */
export const importPublicKey = async (jwk) => {
  return crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true, // extractable (public keys can be extracted)
    [] // public key has no usages in ECDH — only used in deriveBits
  );
};
