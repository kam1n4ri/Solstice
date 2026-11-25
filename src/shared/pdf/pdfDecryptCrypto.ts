import {
  md5,
  RC4,
  sha256,
  computeHash2B,
  concat,
  encodePasswordLegacy,
  encodePasswordAES256,
} from '@pdfsmaller/pdf-encrypt';

export type PdfCipherMode = 'None' | 'RC4' | 'AES-128' | 'AES-256';

const PDF_PADDING = new Uint8Array([
  0x28, 0xbf, 0x4e, 0x5e, 0x4e, 0x75, 0x8a, 0x41,
  0x64, 0x00, 0x4e, 0x56, 0xff, 0xfa, 0x01, 0x08,
  0x2e, 0x2e, 0x00, 0xb6, 0xd0, 0x68, 0x3e, 0x80,
  0x2f, 0x0c, 0xa9, 0xfe, 0x64, 0x53, 0x69, 0x7a,
]);

const AES_SALTD_SUFFIX = new Uint8Array([0x73, 0x41, 0x6c, 0x54]);

export interface StandardEncryptParams {
  v: number;
  r: number;
  keyLengthBits: number;
  permissions: number;
  encryptMetadata: boolean;
  o: Uint8Array;
  u: Uint8Array;
  oe: Uint8Array;
  ue: Uint8Array;
  fileId: Uint8Array;
  stmMode: PdfCipherMode;
  strMode: PdfCipherMode;
}

export function constantTimeEqual(a: Uint8Array, b: Uint8Array, len?: number): boolean {
  const n = len ?? a.length;
  if (a.length < n || b.length < n) return false;
  let diff = 0;
  for (let i = 0; i < n; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function bytesToPDFStringValue(bytes: Uint8Array): string {
  const out = new Array<string>(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 0x5c) out[i] = '\\\\';
    else if (b === 0x28) out[i] = '\\(';
    else if (b === 0x29) out[i] = '\\)';
    else if (b === 0x0d) out[i] = '\\r';
    else if (b === 0x0a) out[i] = '\\n';
    else out[i] = String.fromCharCode(b);
  }
  return out.join('');
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return copy.buffer;
}

function le32(value: number): Uint8Array {
  const out = new Uint8Array(4);
  out[0] = value & 0xff;
  out[1] = (value >> 8) & 0xff;
  out[2] = (value >> 16) & 0xff;
  out[3] = (value >> 24) & 0xff;
  return out;
}

function padLegacyPasswordBytes(pwdBytes: Uint8Array): Uint8Array {
  const padded = new Uint8Array(32);
  if (pwdBytes.length >= 32) {
    padded.set(pwdBytes.subarray(0, 32));
  } else {
    padded.set(pwdBytes);
    padded.set(PDF_PADDING.subarray(0, 32 - pwdBytes.length), pwdBytes.length);
  }
  return padded;
}

function computeLegacyKey(paddedPwd: Uint8Array, params: StandardEncryptParams): Uint8Array {
  const keyLenBytes = Math.max(5, Math.min(16, Math.floor(params.keyLengthBits / 8)));
  const parts: Uint8Array[] = [paddedPwd, params.o.subarray(0, 32), le32(params.permissions), params.fileId];
  if (params.r >= 4 && !params.encryptMetadata) {
    parts.push(new Uint8Array([0xff, 0xff, 0xff, 0xff]));
  }
  let hash = md5(concat(...parts));
  if (params.r >= 3) {
    for (let i = 0; i < 50; i++) {
      hash = md5(hash.subarray(0, keyLenBytes));
    }
  }
  return hash.subarray(0, keyLenBytes);
}

function verifyLegacyUserKey(key: Uint8Array, params: StandardEncryptParams): boolean {
  if (params.r === 2) {
    const computed = new RC4(key).process(PDF_PADDING);
    return constantTimeEqual(computed, params.u, 32);
  }
  const digest = md5(concat(PDF_PADDING, params.fileId));
  let res = new RC4(key).process(digest);
  const iterKey = new Uint8Array(key.length);
  for (let i = 1; i <= 19; i++) {
    for (let j = 0; j < key.length; j++) iterKey[j] = key[j] ^ i;
    res = new RC4(iterKey).process(res);
  }
  return constantTimeEqual(res, params.u, 16);
}

function authenticateLegacyPassword(password: string, params: StandardEncryptParams): Uint8Array | null {
  let pwdBytes: Uint8Array;
  try {
    pwdBytes = encodePasswordLegacy(password);
  } catch {
    return null;
  }
  const padded = padLegacyPasswordBytes(pwdBytes);

  // Check as User Password (Algorithm 6)
  const userCandidateKey = computeLegacyKey(padded, params);
  if (verifyLegacyUserKey(userCandidateKey, params)) {
    return userCandidateKey;
  }

  // Check as Owner Password (Algorithm 7)
  const keyLenBytes = Math.max(5, Math.min(16, Math.floor(params.keyLengthBits / 8)));
  let ownerHash = md5(padded);
  if (params.r >= 3) {
    for (let i = 0; i < 50; i++) {
      ownerHash = md5(ownerHash.subarray(0, keyLenBytes));
    }
  }
  const ownerRc4Key = ownerHash.subarray(0, keyLenBytes);

  let recoveredUser: Uint8Array;
  if (params.r === 2) {
    recoveredUser = new RC4(ownerRc4Key).process(params.o.subarray(0, 32));
  } else {
    let buf: Uint8Array = new Uint8Array(params.o.subarray(0, 32));
    const iterKey = new Uint8Array(ownerRc4Key.length);
    for (let i = 19; i >= 0; i--) {
      for (let j = 0; j < ownerRc4Key.length; j++) iterKey[j] = ownerRc4Key[j] ^ i;
      buf = new RC4(iterKey).process(buf);
    }
    recoveredUser = buf;
  }

  const ownerDerivedFileKey = computeLegacyKey(recoveredUser, params);
  if (verifyLegacyUserKey(ownerDerivedFileKey, params)) {
    return ownerDerivedFileKey;
  }
  return null;
}

/**
 * Unwraps a 32-byte key (UE/OE) encrypted with AES-256-CBC and no padding
 * by appending a synthesized valid PKCS#7 padding block before calling WebCrypto.
 */
async function aes256CbcDecryptNoPad(ciphertext: Uint8Array, keyBytes: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', toArrayBuffer(keyBytes), 'AES-CBC', false, ['encrypt', 'decrypt']);
  const zeroIv = new Uint8Array(16);
  const lastBlock = ciphertext.subarray(ciphertext.length - 16);
  const padInput = new Uint8Array(16);
  for (let i = 0; i < 16; i++) padInput[i] = lastBlock[i] ^ 0x10;
  const padCipher = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: zeroIv }, cryptoKey, toArrayBuffer(padInput));
  const paddedCiphertext = concat(ciphertext, new Uint8Array(padCipher).subarray(0, 16));
  const plain = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: zeroIv }, cryptoKey, toArrayBuffer(paddedCiphertext));
  return new Uint8Array(plain);
}

async function authenticateModernWithBytes(pwdBytes: Uint8Array, params: StandardEncryptParams): Promise<Uint8Array | null> {
  const u = params.u;
  const o = params.o;
  if (u.length < 48 || o.length < 48 || params.ue.length < 32 || params.oe.length < 32) {
    return null;
  }

  const hashFn = async (pwd: Uint8Array, salt: Uint8Array, uKey: Uint8Array): Promise<Uint8Array> => {
    if (params.r >= 6) return await computeHash2B(pwd, salt, uKey);
    return await sha256(concat(pwd, salt, uKey));
  };

  // 1. User password check
  const uValidation = await hashFn(pwdBytes, u.subarray(32, 40), new Uint8Array(0));
  if (constantTimeEqual(uValidation, u, 32)) {
    const k = await hashFn(pwdBytes, u.subarray(40, 48), new Uint8Array(0));
    return await aes256CbcDecryptNoPad(params.ue.subarray(0, 32), k);
  }

  // 2. Owner password check
  const oValidation = await hashFn(pwdBytes, o.subarray(32, 40), u.subarray(0, 48));
  if (constantTimeEqual(oValidation, o, 32)) {
    const k = await hashFn(pwdBytes, o.subarray(40, 48), u.subarray(0, 48));
    return await aes256CbcDecryptNoPad(params.oe.subarray(0, 32), k);
  }

  return null;
}

async function authenticateModernPassword(password: string, params: StandardEncryptParams): Promise<Uint8Array | null> {
  const candidates: Uint8Array[] = [];
  if (params.r >= 6) {
    try {
      candidates.push(encodePasswordAES256(password));
    } catch {
      // Fall through to raw UTF-8 candidate
    }
  }
  const utf8 = new TextEncoder().encode(password).subarray(0, 127);
  if (candidates.length === 0 || !constantTimeEqual(candidates[0], utf8, Math.max(candidates[0].length, utf8.length))) {
    candidates.push(utf8);
  }

  for (const pwdBytes of candidates) {
    const key = await authenticateModernWithBytes(pwdBytes, params);
    if (key) return key;
  }
  return null;
}

export async function authenticatePdfPassword(password: string, params: StandardEncryptParams): Promise<Uint8Array | null> {
  if (params.r >= 5 || params.v >= 5) {
    return await authenticateModernPassword(password, params);
  }
  return authenticateLegacyPassword(password, params);
}

export async function decryptPdfData(
  data: Uint8Array,
  objNum: number,
  genNum: number,
  mode: PdfCipherMode,
  fileKey: Uint8Array,
  aes256CryptoKey: CryptoKey | null
): Promise<Uint8Array> {
  if (mode === 'None' || data.length === 0) return data;

  if (mode === 'AES-256') {
    if (data.length <= 16 || !aes256CryptoKey) return data;
    const iv = data.subarray(0, 16);
    const ct = data.subarray(16);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: toArrayBuffer(iv) }, aes256CryptoKey, toArrayBuffer(ct));
    return new Uint8Array(decrypted);
  }

  const refBytes = new Uint8Array([
    objNum & 0xff,
    (objNum >> 8) & 0xff,
    (objNum >> 16) & 0xff,
    genNum & 0xff,
    (genNum >> 8) & 0xff,
  ]);
  const keyLen = Math.min(fileKey.length + 5, 16);

  if (mode === 'AES-128') {
    if (data.length <= 16) return data;
    const objKey = md5(concat(fileKey, refBytes, AES_SALTD_SUFFIX)).subarray(0, keyLen);
    const cryptoKey = await crypto.subtle.importKey('raw', toArrayBuffer(objKey), 'AES-CBC', false, ['decrypt']);
    const iv = data.subarray(0, 16);
    const ct = data.subarray(16);
    const decrypted = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: toArrayBuffer(iv) }, cryptoKey, toArrayBuffer(ct));
    return new Uint8Array(decrypted);
  }

  // RC4
  const objKey = md5(concat(fileKey, refBytes)).subarray(0, keyLen);
  return new RC4(objKey).process(data);
}

export async function importAes256DecryptKey(fileKey: Uint8Array): Promise<CryptoKey> {
  return await crypto.subtle.importKey('raw', toArrayBuffer(fileKey.subarray(0, 32)), 'AES-CBC', false, ['decrypt']);
}
