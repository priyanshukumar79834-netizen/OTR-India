/**
 * MOCK ISSUER — NOT A REAL VERIFICATION AUTHORITY.
 *
 * MASTER_SPECIFICATION.md §6, §23, §36 and ANCHAL_DEVELOPER_INSTRUCTIONS.md §26
 * require that this be unmistakably simulated: no real trusted-issuer
 * integration, no real digital signatures, no real government verification.
 *
 * This module simulates an issuer (e.g. "Mock Education Board") deciding
 * whether a submitted credential is genuine. In the real system this would
 * be an external call to an actual issuing authority; here it's a rule of
 * thumb over synthetic demo data, purely so the VERIFIED / REJECTED
 * transition has something driving it in the prototype.
 */

const MOCK_ISSUER_NAME = 'Mock Education Board (SIMULATED — not a real verification authority)';

/**
 * Decide verification outcome for a credential. Deterministic-ish: rejects
 * obviously-invalid synthetic references, otherwise verifies. This is a
 * prototype heuristic, not a real trust decision.
 */
function evaluate(credential) {
  const ref = (credential.reference || '').trim();
  if (!ref || ref.toUpperCase() === 'INVALID') {
    return { outcome: 'REJECTED', issuer: MOCK_ISSUER_NAME };
  }
  return { outcome: 'VERIFIED', issuer: MOCK_ISSUER_NAME };
}

module.exports = { evaluate, MOCK_ISSUER_NAME };
