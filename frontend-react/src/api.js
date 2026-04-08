const BASE = '/api';

export async function apiFetch(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    ...options,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json.message ||
      Object.values(json.errors || {}).flat().join(' ') ||
      'שגיאה בשרת';
    throw new Error(msg);
  }
  return json;
}
