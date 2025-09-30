export async function createSession(prompt: string) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error('Failed to create session');
  return res.json();
}
