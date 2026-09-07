export type JumpState = { height: number; velocity: number; held: boolean };
export const freshJump = (): JumpState => ({ height: 0, velocity: 0, held: false });

// One jump per press, with no midair retrigger or repeated bouncing on hold.
export function stepJump(state: JumpState, pressed: boolean, elapsed: number): JumpState {
  const dt = Math.max(0, Math.min(elapsed, .05));
  let velocity = state.velocity;
  if (pressed && !state.held && state.height === 0) velocity = 6.5;
  const height = Math.max(0, state.height + velocity * dt - 9 * dt * dt);
  velocity = height === 0 ? 0 : velocity - 18 * dt;
  return { height, velocity, held: pressed };
}
