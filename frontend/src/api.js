const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchScores() {
  const response = await fetch(`${API_BASE}/api/scores`);
  if (!response.ok) throw new Error('Failed to fetch scores');
  return response.json();
}

export async function fetchLatest() {
  const response = await fetch(`${API_BASE}/api/latest`);
  if (!response.ok) throw new Error('Failed to fetch latest');
  return response.json();
}

export async function submitUpdate(message, apiKey, force = false) {
  const response = await fetch(`${API_BASE}/api/update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify({ message, force }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to submit update');
  }

  return data;
}
