import { randomBytes } from 'crypto';

/**
 * Generates identifiers that are NOT derivable from Aadhaar, phone, DOB,
 * or email (MASTER_SPECIFICATION.md §12). Both use cryptographically
 * random bytes — never a hash or encoding of personal data.
 */
function randomSegment(length: number): string {
  return randomBytes(length)
    .toString('hex')
    .toUpperCase()
    .slice(0, length);
}

/** e.g. OTR-IND-8F3A92C1 */
export function generateOtrId(): string {
  return `OTR-IND-${randomSegment(8)}`;
}

/** e.g. APP-SSC-2026-4F2A */
export function generateApplicationRefId(portalCode: string, year = new Date().getFullYear()): string {
  const safeCode = portalCode.replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'GEN';
  return `APP-${safeCode}-${year}-${randomSegment(4)}`;
}

/** e.g. CONSENT-9B21F0 */
export function generateConsentReference(): string {
  return `CONSENT-${randomSegment(6)}`;
}
