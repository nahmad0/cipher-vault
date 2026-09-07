export type Challenge = {
  id: string; title: string; category: string; points: number; color: string;
  position: [number, number]; briefing: string; files: Record<string, string>;
  hints: string[]; answer: string; lesson: string; requires: string[];
};
export const challenges: Challenge[] = [
  { id: 'signal', title: 'Ghost signal', category: 'ENCODING', points: 100, color: '#68f5d2', position: [-8, 5], requires: [],
    briefing: 'A maintenance beacon is broadcasting an encoded message. Inspect the intercepted file and decode the payload to recover the flag.',
    files: { 'beacon.txt': 'TRANSMISSION 0042\nContent-Transfer-Encoding: base64\nPayload: Q1RGe2VuY29kaW5nX2lzX25vdF9lbmNyeXB0aW9ufQ==', 'readme.txt': 'Use cat beacon.txt to read the capture.\nThe decode command accepts base64 text: decode <payload>.' },
    hints: ['Read beacon.txt with cat.', 'Base64 represents binary data as text; it does not require a secret key.', 'Run decode Q1RGe2VuY29kaW5nX2lzX25vdF9lbmNyeXB0aW9ufQ=='],
    answer: 'CTF{encoding_is_not_encryption}', lesson: 'Base64 is encoding, not encryption. Anyone can decode it. Protect sensitive data with authenticated encryption and proper key management.' },
  { id: 'logs', title: 'After hours', category: 'FORENSICS', points: 150, color: '#a3b5ff', position: [8, 5], requires: [],
    briefing: 'An account was accessed outside maintenance hours. Identify the source IP with repeated failures followed by a successful login. Submit CTF{source_IP}.',
    files: { 'auth.log': '01:12:00 10.0.0.12 user=backup result=success\n02:41:11 203.0.113.42 user=admin result=failed\n02:41:12 203.0.113.42 user=admin result=failed\n02:41:13 203.0.113.42 user=admin result=failed\n02:41:14 203.0.113.42 user=admin result=success\n03:00:00 10.0.0.12 user=backup result=success', 'schedule.txt': 'Backup service: hourly.\nAdmin maintenance window: 09:00–17:00.\nFlag format: CTF{203.0.113.X}' },
    hints: ['Use cat auth.log to inspect login events.', 'grep failed auth.log narrows the suspicious attempts.', 'Look for the IP that also succeeds at 02:41:14.'],
    answer: 'CTF{203.0.113.42}', lesson: 'Correlate failures, successful logins, source addresses, and expected activity. MFA, rate limiting, and timely alerts reduce account takeover risk.' },
  { id: 'access', title: 'Wrong clearance', category: 'ACCESS CONTROL', points: 200, color: '#ffc875', position: [-8, -5], requires: ['signal'],
    briefing: 'A simulated report service trusts document IDs without checking ownership. You are trainee-7. Inspect the API guide and compare your report with report 1043. Recover the flag from the improperly exposed report.',
    files: { 'api.txt': 'TRAINING SERVICE — no real network requests\nSession: trainee-7\nYour report: /api/reports/1042\nCommand: request /api/reports/<id>\nAudit target: report 1043', 'policy.txt': 'Every report requires an ownership check on the server.\nA predictable ID is not itself a vulnerability; missing authorization is.' },
    hints: ['Read api.txt for the simulated request command.', 'Compare request /api/reports/1042 with request /api/reports/1043.', 'The second response exposes another owner’s report. Submit its flag.'],
    answer: 'CTF{check_ownership_server_side}', lesson: 'This is broken object-level authorization. Validate the authenticated user’s permission for every object on the server. Unpredictable IDs alone do not fix it.' },
  { id: 'packets', title: 'In plain sight', category: 'NETWORK SECURITY', points: 200, color: '#82d9ff', position: [8, -5], requires: ['logs'],
    briefing: 'An internal service sent a secret over cleartext HTTP. Inspect the packet capture to find the exposed token and submit it as a flag.',
    files: { 'capture.txt': 'PACKET 001 10.0.0.8 → 10.0.0.20 TCP/80\nPOST /session HTTP/1.1\nHost: training.internal\nContent-Type: application/x-www-form-urlencoded\n\nuser=operator&token=CTF{use_tls_everywhere}\n\nPACKET 002 10.0.0.20 → 10.0.0.8 TCP/80\nHTTP/1.1 200 OK', 'task.txt': 'The capture is fictional. Inspect capture.txt.\nQuestion: what secret is visible to a network observer?' },
    hints: ['Read capture.txt.', 'grep token capture.txt finds the credential.', 'The token already uses the CTF{...} flag format.'],
    answer: 'CTF{use_tls_everywhere}', lesson: 'Cleartext HTTP exposes data to network observers. Enforce TLS with certificate validation, avoid logging secrets, and rotate credentials after exposure.' },
  { id: 'response', title: 'Contain the breach', category: 'INCIDENT RESPONSE', points: 300, color: '#f9a5dd', position: [0, -12], requires: ['access', 'packets'],
    briefing: 'Combine the evidence from the facility. Read the incident report and choose the best immediate containment action. Submit CTF{action_code}.',
    files: { 'incident.txt': 'ACTIVE INCIDENT\nCompromised account: svc-export\nStolen token: still valid\nAffected host: export-02\nEvidence snapshot: already preserved\nExfiltration: ongoing\n\nACTIONS\nA: Delete all logs and reboot the fleet\nB: Revoke the token and isolate export-02\nC: Wait for the weekly patch window\nD: Base64-encode the stolen token\n\nSubmit CTF{A}, CTF{B}, CTF{C}, or CTF{D}.' },
    hints: ['Stop ongoing access while preserving evidence.', 'Encoding does not invalidate a stolen token.', 'Choose the action that revokes credentials and isolates the affected host.'],
    answer: 'CTF{B}', lesson: 'Contain active compromise by revoking exposed credentials and isolating affected systems. Preserve evidence, investigate scope, eradicate the cause, and recover with monitoring.' },
];
export type Progress = { solved: string[]; hints: Record<string, number>; seconds: number; extracted: boolean };
export const freshProgress = (): Progress => ({ solved: [], hints: Object.fromEntries(challenges.map(c => [c.id, 0])), seconds: 0, extracted: false });
export const isUnlocked = (c: Challenge, solved: string[]) => c.requires.every(id => solved.includes(id));
export const score = (p: Progress) => challenges.reduce((sum, c) => sum + (p.solved.includes(c.id) ? Math.max(25, c.points - (p.hints[c.id] || 0) * 15) : 0), 0);
export function restoreProgress(raw: string | null): Progress {
  try { const p = JSON.parse(raw || '{}'); return {
    solved: Array.isArray(p.solved) ? [...new Set<string>(p.solved.filter((s: unknown) => challenges.some(c => c.id === s)))] : [],
    hints: Object.fromEntries(challenges.map(c => [c.id, Math.max(0, Math.min(c.hints.length, Math.floor(Number(p.hints?.[c.id]) || 0)))])),
    seconds: Number.isFinite(p.seconds) ? Math.max(0, Math.floor(p.seconds)) : 0, extracted: p.extracted === true && challenges.every(c => p.solved?.includes(c.id)),
  }; } catch { return freshProgress(); }
}
export function runCommand(c: Challenge, input: string): string {
  const [cmd, ...args] = input.trim().split(/\s+/); const value = args.join(' ');
  switch (cmd?.toLowerCase()) {
    case 'help': return 'help                    Show commands\nls                      List evidence files\ncat <file>              Read a file\ngrep <text> <file>      Find matching lines\ndecode <base64>         Decode Base64\nrequest <path>          Query simulated API\nsubmit CTF{...}         Capture a flag\nclear                   Clear terminal';
    case 'ls': return Object.keys(c.files).join('\n');
    case 'cat': return c.files[value] ?? 'File not found. Use ls to list evidence.';
    case 'grep': { const file = args.at(-1) || ''; const query = args.slice(0, -1).join(' '); return !query ? 'Usage: grep <text> <file>' : c.files[file]?.split('\n').filter(line => line.toLowerCase().includes(query.toLowerCase())).join('\n') || 'No matches, or file not found.'; }
    case 'decode': try { return atob(value); } catch { return 'Invalid Base64. Usage: decode <base64 payload>'; }
    case 'request': return c.id !== 'access' ? 'No API attached to this lab.' : value === '/api/reports/1042' ? '200 OK\nowner: trainee-7\nreport: Routine maintenance. No anomalies.' : value === '/api/reports/1043' ? '200 OK\nowner: security-admin\nRESTRICTED REPORT\nflag: CTF{check_ownership_server_side}\nFinding: server returned an object you do not own.' : '404 Not Found. Read api.txt for available routes.';
    default: return `Unknown command: ${cmd || '(empty)'}. Type help. This terminal is a simulation.`;
  }
}
