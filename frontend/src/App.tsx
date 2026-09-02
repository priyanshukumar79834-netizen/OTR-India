import { useEffect, useState } from 'react';

/**
 * Foundation placeholder only.
 *
 * This component exists to prove the frontend scaffold can actually reach
 * the backend (`GET /api/health`) — it is deliberately NOT the citizen-facing
 * UI. Adi owns everything described in ADI_DEVELOPER_INSTRUCTIONS.md
 * (registration, OTR profile UI, consent review, dashboard, etc.) and should
 * replace this file's contents rather than build around it.
 */

interface HealthResponse {
  success: boolean;
  data?: { status: string; database: string; timestamp: string };
  error?: { code: string; message: string };
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((body: HealthResponse) => setHealth(body))
      .catch((err) => setError(err instanceof Error ? err.message : 'Unknown error'));
  }, []);

  return (
    <main style={{ fontFamily: 'sans-serif', padding: '2rem', maxWidth: 640 }}>
      <h1>OTR-India</h1>
      <p>
        Foundation placeholder page. This confirms the frontend can reach the backend API — it is
        not the citizen-facing application.
      </p>

      <h2>Backend health check</h2>
      {error && <p style={{ color: 'crimson' }}>Failed to reach backend: {error}</p>}
      {!error && !health && <p>Checking backend status…</p>}
      {health?.success && (
        <ul>
          <li>Status: {health.data?.status}</li>
          <li>Database: {health.data?.database}</li>
          <li>Checked at: {health.data?.timestamp}</li>
        </ul>
      )}
      {health && !health.success && (
        <p style={{ color: 'crimson' }}>
          Backend reported an error: {health.error?.code} — {health.error?.message}
        </p>
      )}
    </main>
  );
}
