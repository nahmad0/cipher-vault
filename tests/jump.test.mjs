import test from 'node:test';
import assert from 'node:assert/strict';
import { freshJump, stepJump } from '../lib/jump.ts';

test('jump rises, falls, and lands on the floor', () => {
  let s = freshJump(); let peak = 0;
  for (let i = 0; i < 120; i++) { s = stepJump(s, i === 0, 1 / 60); peak = Math.max(peak, s.height); assert.ok(s.height >= 0); }
  assert.ok(peak > 1 && peak < 1.3); assert.equal(s.height, 0); assert.equal(s.velocity, 0);
});
test('holding jump does not bounce repeatedly; release allows another jump', () => {
  let s = freshJump();
  for (let i = 0; i < 120; i++) s = stepJump(s, true, 1 / 60);
  assert.equal(s.height, 0);
  s = stepJump(s, false, 1 / 60); s = stepJump(s, true, 1 / 60);
  assert.ok(s.height > 0);
});
test('midair jump presses do not reset upward velocity', () => {
  let s = stepJump(freshJump(), true, 1 / 60);
  s = stepJump(s, false, 1 / 60); const before = s.velocity;
  s = stepJump(s, true, 1 / 60); assert.ok(s.velocity < before);
});
