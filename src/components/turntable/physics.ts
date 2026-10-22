/*
 * Turntable maths, kept free of DOM and audio APIs so it can be unit-tested.
 * Angles are degrees, clockwise positive (screen coordinates), time in seconds.
 */

/** 33⅓ rpm expressed in degrees per second. */
export const RPM_33_DEG_PER_S = (100 / 3 / 60) * 360; // 200

/** Rotation beyond which a drag counts as a deliberate scratch (not a tap). */
export const SCRATCH_THRESHOLD_DEG = 6;
/** A tap: barely moved and quickly released. Toggles playback. */
export const TAP_MAX_DEG = 2;
export const TAP_MAX_MS = 300;

/** Angle of point (x, y) around centre (cx, cy). */
export function pointerAngle(cx: number, cy: number, x: number, y: number): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}

/** Smallest signed difference from `prev` to `next`, in (-180, 180]. */
export function unwrapDelta(prev: number, next: number): number {
  let d = (next - prev) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Motor torque: a stopped record reaches 33⅓ rpm in 0.5 s (direct-drive feel). */
export const MOTOR_DEG_PER_S2 = 400;
/** Braking: a playing record (200°/s) stops in 0.8 s. */
export const BRAKE_DEG_PER_S2 = 250;

/**
 * Platter velocity one frame later. The motor accelerates toward the target at
 * a constant rate; anything faster than the target (a flick, or a pause) is
 * braked at a constant rate. Both end exactly on the target, so the record
 * never creeps.
 */
export function stepPlatter(velocity: number, target: number, dt: number): number {
  const step = Math.max(0, dt);
  // Driving = the motor pushing the platter up toward target speed in the same direction.
  const driving = target !== 0 && Math.abs(velocity) < Math.abs(target) && velocity * target >= 0;
  const rate = (driving ? MOTOR_DEG_PER_S2 : BRAKE_DEG_PER_S2) * step;
  return velocity < target ? Math.min(target, velocity + rate) : Math.max(target, velocity - rate);
}

/** Playback rate for the scratch engine from the hand's angular velocity. */
export function scratchRate(degPerSecond: number, limit = 4): number {
  const r = degPerSecond / RPM_33_DEG_PER_S;
  return Math.max(-limit, Math.min(limit, r));
}

/** Where playback resumes after a scratch: grab position plus net rotation. */
export function resumePosition(grabTime: number, netDegrees: number, duration: number): number {
  const t = grabTime + netDegrees / RPM_33_DEG_PER_S;
  const max = Number.isFinite(duration) && duration > 0 ? Math.max(0, duration - 0.05) : Math.max(0, t);
  return Math.max(0, Math.min(max, t));
}

/**
 * Angular velocity from recent pointer samples. Uses samples inside a short
 * window so the estimate follows the hand without jitter from single events.
 */
export class VelocityTracker {
  private samples: { t: number; angle: number }[] = [];

  constructor(private windowMs = 60) {}

  reset(): void {
    this.samples = [];
  }

  /** `angle` is the accumulated (unwrapped) rotation. `t` in milliseconds. */
  push(t: number, angle: number): void {
    this.samples.push({ t, angle });
    const cutoff = t - this.windowMs;
    while (this.samples.length > 2 && this.samples[0]!.t < cutoff) this.samples.shift();
  }

  /** Degrees per second; 0 when the hand has not moved recently. */
  velocity(now: number): number {
    const last = this.samples[this.samples.length - 1];
    const first = this.samples[0];
    if (!last || !first || last === first) return 0;
    if (now - last.t > this.windowMs) return 0;
    const dt = (last.t - first.t) / 1000;
    return dt > 0 ? (last.angle - first.angle) / dt : 0;
  }
}
