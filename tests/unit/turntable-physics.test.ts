import { describe, expect, it } from 'vitest';
import {
  BRAKE_DEG_PER_S2,
  RPM_33_DEG_PER_S,
  VelocityTracker,
  pointerAngle,
  resumePosition,
  scratchRate,
  stepPlatter,
  unwrapDelta,
} from '@/components/turntable/physics';

const run = (v: number, target: number, seconds: number, dt = 1 / 60) => {
  for (let t = 0; t < seconds; t += dt) v = stepPlatter(v, target, dt);
  return v;
};

describe('turntable physics', () => {
  it('33⅓ rpm is 200° per second', () => {
    expect(RPM_33_DEG_PER_S).toBeCloseTo(200, 6);
  });

  it('measures pointer angles clockwise from 3 o’clock', () => {
    expect(pointerAngle(0, 0, 1, 0)).toBe(0);
    expect(pointerAngle(0, 0, 0, 1)).toBe(90); // screen y points down
    expect(pointerAngle(0, 0, -1, 0)).toBe(180);
  });

  it('unwraps across the ±180° seam', () => {
    expect(unwrapDelta(170, -170)).toBe(20);
    expect(unwrapDelta(-170, 170)).toBe(-20);
    expect(unwrapDelta(10, 30)).toBe(20);
  });

  it('spins up to 33⅓ rpm in about half a second', () => {
    expect(run(0, RPM_33_DEG_PER_S, 0.25)).toBeLessThan(RPM_33_DEG_PER_S);
    expect(run(0, RPM_33_DEG_PER_S, 0.55)).toBe(RPM_33_DEG_PER_S);
  });

  it('a backwards-spinning record is braked through zero, then driven forwards', () => {
    expect(run(-100, RPM_33_DEG_PER_S, 2)).toBe(RPM_33_DEG_PER_S);
  });

  it('brakes to a full stop, not a creeping crawl', () => {
    const stopTime = RPM_33_DEG_PER_S / BRAKE_DEG_PER_S2;
    expect(run(RPM_33_DEG_PER_S, 0, stopTime * 0.5)).toBeGreaterThan(50);
    expect(run(RPM_33_DEG_PER_S, 0, stopTime + 0.05)).toBe(0);
  });

  it('brakes a backwards flick to zero too', () => {
    expect(run(-300, 0, 2)).toBe(0);
  });

  it('maps hand speed to a bounded playback rate', () => {
    expect(scratchRate(200)).toBe(1);
    expect(scratchRate(-400)).toBe(-2);
    expect(scratchRate(10_000)).toBe(4);
    expect(scratchRate(-10_000)).toBe(-4);
  });

  it('resumes from grab point plus net rotation, clamped to the track', () => {
    expect(resumePosition(10, 0, 60)).toBe(10);
    expect(resumePosition(10, -400, 60)).toBe(8); // two turns of hand back = 2 s
    expect(resumePosition(1, -2000, 60)).toBe(0);
    expect(resumePosition(59, 2000, 60)).toBeCloseTo(59.95, 5);
  });

  it('tracks hand velocity and drops to zero when the hand stops', () => {
    const v = new VelocityTracker(60);
    v.push(0, 0);
    v.push(20, 4);
    v.push(40, 8);
    expect(v.velocity(40)).toBeCloseTo(200, 5);
    expect(v.velocity(200)).toBe(0);
  });
});
