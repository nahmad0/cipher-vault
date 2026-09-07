import test from 'node:test';
import assert from 'node:assert/strict';
import { challenges, runCommand, isUnlocked, score, freshProgress, restoreProgress } from '../lib/challenges.ts';

test('every mission is reachable in prerequisite order with unique IDs', () => {
  assert.equal(new Set(challenges.map(c => c.id)).size, challenges.length);
  const solved = [];
  for (const c of challenges) { assert.ok(isUnlocked(c, solved)); solved.push(c.id); }
  assert.equal(solved.length, 5);
  assert.equal(isUnlocked(challenges[4], []), false);
  assert.equal(isUnlocked(challenges[4], ['access']), false);
  assert.equal(isUnlocked(challenges[4], ['access', 'packets']), true);
});
test('each flag can be recovered from the provided evidence', () => {
  const [signal, logs, access, packets, response] = challenges;
  const payload = signal.files['beacon.txt'].split('Payload: ')[1];
  assert.equal(runCommand(signal, `decode ${payload}`), signal.answer);
  assert.match(runCommand(logs, 'grep failed auth.log'), /203\.0\.113\.42/);
  assert.ok(runCommand(logs, 'cat auth.log').includes('203.0.113.42 user=admin result=success'));
  assert.ok(runCommand(access, 'request /api/reports/1043').includes(access.answer));
  assert.ok(!runCommand(access, 'request /api/reports/1042').includes(access.answer));
  assert.ok(runCommand(packets, 'grep token capture.txt').includes(packets.answer));
  assert.ok(response.files['incident.txt'].includes('B: Revoke the token and isolate export-02'));
  assert.equal(response.answer, 'CTF{B}');
});
test('terminal handles invalid input safely without executing a real shell or network request', () => {
  const c = challenges[0];
  assert.match(runCommand(c, 'cat missing.txt'), /not found/);
  assert.match(runCommand(c, 'decode !@#$'), /Invalid/);
  assert.match(runCommand(c, 'curl https://example.com'), /Unknown command/);
  assert.match(runCommand(c, 'request /api/reports/1043'), /No API/);
  assert.match(runCommand(c, 'grep'), /Usage/);
});
test('hints reduce earned score only for completed labs', () => {
  const p = freshProgress(); p.hints.signal = 2;
  assert.equal(score(p), 0); p.solved.push('signal'); assert.equal(score(p), 70);
  p.solved = challenges.map(c => c.id); p.hints = {}; assert.equal(score(p), 950);
});
test('saved progress tolerates corruption and rejects unknown or duplicate flags', () => {
  assert.deepEqual(restoreProgress('broken'), restoreProgress(null));
  const p = restoreProgress(JSON.stringify({ solved: ['signal', 'signal', 'fake'], hints: { signal: 100, logs: -4 }, seconds: -5, extracted: true }));
  assert.deepEqual(p.solved, ['signal']); assert.equal(p.hints.signal, 3); assert.equal(p.hints.logs, 0); assert.equal(p.seconds, 0); assert.equal(p.extracted, false);
  const complete = { ...freshProgress(), solved: challenges.map(c => c.id), extracted: true };
  assert.equal(restoreProgress(JSON.stringify(complete)).extracted, true);
});
