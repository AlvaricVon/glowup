/**
 * Kunci biometrik Vault pakai WebAuthn (sidik jari / wajah / PIN perangkat).
 * Client-only, tanpa server: yang disimpan cuma credential ID di localStorage.
 * Catatan: WebAuthn butuh secure context (HTTPS atau localhost).
 */

const CRED_KEY = 'voskhod-vault-cred';

export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.PublicKeyCredential !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    !!navigator.credentials
  );
}

/** True kalau perangkat punya sensor biometrik platform (sidik jari / wajah). */
export async function isPlatformAuthAvailable(): Promise<boolean> {
  try {
    if (!isWebAuthnSupported()) return false;
    const Pkc = window.PublicKeyCredential;
    if (typeof Pkc.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false;
    return await Pkc.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** WebAuthn cuma jalan di HTTPS / localhost. */
export function isSecureContext(): boolean {
  return typeof window !== 'undefined' && window.isSecureContext === true;
}

export function getStoredCredentialId(): string | null {
  try {
    return window.localStorage.getItem(CRED_KEY);
  } catch {
    return null;
  }
}

export function clearStoredCredential(): void {
  try {
    window.localStorage.removeItem(CRED_KEY);
  } catch {
    /* abaikan */
  }
}

function bufToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBuf(s: string): ArrayBuffer {
  const pad = '='.repeat((4 - (s.length % 4)) % 4);
  const bin = atob((s + pad).replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function newChallenge(): ArrayBuffer {
  const buf = new ArrayBuffer(32);
  const view = new Uint8Array(buf);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(view);
  } else {
    for (let i = 0; i < view.length; i++) view[i] = Math.floor(Math.random() * 256);
  }
  return buf;
}

function friendlyError(e: unknown, fallback: string): Error {
  if (e instanceof Error) {
    switch (e.name) {
      case 'NotAllowedError':
        return new Error('Verifikasi dibatalkan atau keburu timeout. Coba lagi ya.');
      case 'NotSupportedError':
        return new Error('Perangkat ini tidak mendukung biometrik.');
      case 'SecurityError':
        return new Error('Biometrik butuh koneksi aman (HTTPS) atau localhost.');
      case 'InvalidStateError':
        return new Error('Biometrik ini sudah terdaftar di perangkat.');
      case 'AbortError':
        return new Error('Proses dibatalkan. Coba lagi ya.');
      default:
        if (e.message) return e;
    }
  }
  return new Error(fallback);
}

/**
 * Registrasi biometrik pertama kali. Memicu prompt sidik jari / wajah / PIN.
 * Mengembalikan credential ID sekaligus menyimpannya di localStorage.
 */
export async function registerBiometric(): Promise<string> {
  if (!isWebAuthnSupported()) throw new Error('Browser ini tidak mendukung biometrik (WebAuthn).');
  if (!isSecureContext()) throw new Error('Biometrik butuh konteks aman — buka lewat HTTPS atau localhost.');
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: newChallenge(),
        rp: { name: 'Voskhod Vault' },
        user: { id: new Uint8Array(newChallenge(), 0, 16), name: 'voskhod-vault', displayName: 'Voskhod Vault' },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: { userVerification: 'required' },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;
    if (!cred) throw new Error('Pendaftaran gagal, tidak ada kredensial yang dibuat.');
    const id = bufToB64url(cred.rawId);
    window.localStorage.setItem(CRED_KEY, id);
    return id;
  } catch (e) {
    throw friendlyError(e, 'Pendaftaran biometrik gagal.');
  }
}

/** Verifikasi biometrik untuk kredensial yang tersimpan. */
export async function authenticateBiometric(credId: string): Promise<void> {
  if (!isWebAuthnSupported()) throw new Error('Browser ini tidak mendukung biometrik (WebAuthn).');
  try {
    const cred = (await navigator.credentials.get({
      publicKey: {
        challenge: newChallenge(),
        allowCredentials: [{ id: b64urlToBuf(credId), type: 'public-key' }],
        userVerification: 'preferred',
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    if (!cred) throw new Error('Verifikasi gagal. Coba lagi ya.');
  } catch (e) {
    throw friendlyError(e, 'Verifikasi biometrik gagal.');
  }
}
