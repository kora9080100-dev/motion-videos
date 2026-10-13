import { Easing, interpolate, spring } from "remotion";
import { FPS } from "./theme";

export const outExpo = Easing.bezier(0.16, 1, 0.3, 1);
export const inOut = Easing.bezier(0.65, 0, 0.35, 1);
export const inQuint = Easing.bezier(0.64, 0, 0.78, 0);
export const inCubic = Easing.bezier(0.32, 0, 0.67, 0);

// 0→1 progress between start and start+dur.
export const prog = (
  f: number,
  start: number,
  dur: number,
  easing: (t: number) => number = outExpo,
) =>
  interpolate(f, [start, start + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// Springy 0→1 with a little overshoot.
export const pop = (f: number, start: number, damping = 13, stiffness = 170) =>
  spring({
    frame: f - start,
    fps: FPS,
    config: { damping, stiffness, mass: 0.9 },
  });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Speed of a 0→1 curve at frame f, used to drive motion blur amount.
export const velocity = (fn: (f: number) => number, f: number) =>
  Math.abs(fn(f + 0.5) - fn(f - 0.5));
