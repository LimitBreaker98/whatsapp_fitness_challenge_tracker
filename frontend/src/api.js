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

export async function fetchProfiles() {
  const response = await fetch(`${API_BASE}/api/profiles`);
  if (!response.ok) throw new Error('Failed to fetch profiles');
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

export async function fetchVotes() {
  const response = await fetch(`${API_BASE}/api/votes`);
  if (!response.ok) throw new Error('Failed to fetch votes');
  return response.json();
}

export async function submitVote(code, choice) {
  const response = await fetch(`${API_BASE}/api/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, choice }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Failed to submit vote');
  }

  return data;
}
