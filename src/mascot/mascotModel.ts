/**
 * Barnaby's vocabulary, rig poses and motion timings. Pure data (no React).
 *
 * He is drawn by a 3-layer rig inside each screen's <MascotDockSlot />, so his
 * position comes from the screen's own layout and can never drift:
 *  1. Slot  — a fixed box in the screen (centres him, clips him)
 *  2. Track — ONLY translateX + scaleX: Right → Center → Left
 *  3. Rig   — ONLY micro-interactions around a local 0,0 (center bottom):
 *             wag, bob, tilt, duck, bark
 */

export type MascotState =
  | 'STATE_HIDDEN'
  | 'STATE_ENTER_FROM_RIGHT'
  | 'STATE_IDLE_CENTER'
  | 'STATE_CURIOUS_TILT'
  | 'STATE_PEEKING_DUCK'
  | 'STATE_WOOF_BARK'
  | 'STATE_SCANNING'
  | 'STATE_WALKING'
  | 'STATE_EXIT_TO_LEFT';

/** Which kind of input currently has focus; drives the curious / peeking poses. */
export type FieldKind = 'text' | 'password';

/** Forward CTAs play the exit; back moves don't. */
export type Direction = 'forward' | 'back';

/** Layer 2 — the spatial track. Distances are fractions of the slot's width. */
export const TRACK = {
  /** Off-slot distance on either side: translateX(±130%). */
  offscreen: 1.3,
  /** ENTERING: 130% → 0 facing left, then he turns to face right. */
  enterMs: 550,
  enterEasing: [0.34, 1.56, 0.64, 1] as const,
  /** The turn to face right, inside the last part of the entrance. */
  turnMs: 160,
  /** EXITING: 0 → -130% facing left, ease-in; navigation waits for it. */
  exitMs: 380,
  exitEasing: [0.42, 0, 1, 1] as const,
} as const;

/** Layer 3 — the character rig's pose for each micro-interaction. */
export type RigPoseName = 'IDLE_WAG' | 'WALKING_BOB' | 'CURIOUS_TILT' | 'PEEKING_DUCK' | 'WOOF_BARK';

export interface RigPose {
  y: number;
  rotate: number;
  scale: number;
}

export const RIG_POSES: Record<RigPoseName, RigPose> = {
  // The ±1.5° wag and the 0 ↔ -6px bob are the idle / walk sprite clips below.
  IDLE_WAG: { y: 0, rotate: 0, scale: 1 },
  WALKING_BOB: { y: 0, rotate: 0, scale: 1 },
  CURIOUS_TILT: { y: 0, rotate: 8, scale: 1.04 },
  PEEKING_DUCK: { y: 20, rotate: 0, scale: 0.92 },
  WOOF_BARK: { y: -12, rotate: 0, scale: 1.08 },
};

export const PHYSICS = {
  poseSpring: { damping: 14, stiffness: 180, mass: 1 },
  woofUpMs: 140,
  pillMs: 800,
  /** Curious head tilt when the user changes an option or drags a slider. */
  glanceMs: 900,
  /** Look left / right while scanning. */
  scanTurnMs: 1100,
  walkFps: 12,
  sprintFps: 16,
  woofFps: 12,
  idleFps: 8,
  idleFpsMax: 18,
} as const;

export const SPRITE_FRAME_COUNT = 6;

export type SpriteClipName = 'idle' | 'walk' | 'woof';

/** One frame of a sprite clip, applied inside the rig. */
export interface SpriteFrame {
  translateY: number;
  rotate: number;
  scaleY: number;
}

export interface SpriteClip {
  name: SpriteClipName;
  loop: boolean;
  frames: readonly SpriteFrame[];
}

const frame = (translateY: number, rotate: number, scaleY = 1): SpriteFrame => ({ translateY, rotate, scaleY });

export const CLIPS: Record<SpriteClipName, SpriteClip> = {
  // IDLE_WAG: tail wag rotate(-1.8deg <-> 1.8deg) with a scaleY(0.98 <-> 1.02) breath.
  idle: {
    name: 'idle',
    loop: true,
    frames: [
      frame(0, -1.8, 0.98),
      frame(0, -0.9, 0.99),
      frame(0, 0.9, 1.01),
      frame(0, 1.8, 1.02),
      frame(0, 0.9, 1.01),
      frame(0, -0.9, 0.99),
    ],
  },
  // WALKING_BOB: translateY(0px <-> -6px), a two-step gait per loop.
  walk: {
    name: 'walk',
    loop: true,
    frames: [frame(0, 0), frame(-4, 0), frame(-6, 0), frame(0, 0), frame(-4, 0), frame(-6, 0)],
  },
  // WOOF_BARK: the pose does the hop; the clip only times the bark lines.
  woof: {
    name: 'woof',
    loop: false,
    frames: [frame(0, 0), frame(0, 0), frame(0, 0), frame(0, 0), frame(0, 0), frame(0, 0)],
  },
};

export const WOOF_DURATION_MS = (SPRITE_FRAME_COUNT / PHYSICS.woofFps) * 1000;
