export const FRAME_DELTA_CAP = 1 / 20;

export const DEFAULT_FONT_FAMILY =
  '"IBM Plex Mono", "SFMono-Regular", Menlo, Monaco, Consolas, "Liberation Mono", monospace';

export function createFonts(fontFamily: string) {
  return {
    hud: `700 14px ${fontFamily}`,
    overlay: `800 28px ${fontFamily}`,
    overlaySub: `600 16px ${fontFamily}`,
    paddle: `800 18px ${fontFamily}`,
    particle: `700 13px ${fontFamily}`,
    title: `800 24px ${fontFamily}`,
  };
}

export const LINE_HEIGHTS = {
  hud: 18,
  overlay: 36,
  overlaySub: 22,
  paddle: 22,
  particle: 16,
  title: 30,
};

export const HUD_HEIGHT = 52;
export const PADDLE_MARGIN_BOTTOM = 50;
export const PADDLE_TEXT = '═══════════════';
export const INITIAL_LIVES = 3;
export const BASE_BALL_SPEED = 420;
export const BALL_RADIUS = 10;
export const PADDLE_KEYBOARD_SPEED = 1000;
export const MAX_CANVAS_DPR = 1.5;
export const MAX_PARTICLES = 120;
export const REDUCED_MAX_PARTICLES = 64;
export const MAX_WAVES = 10;
export const REDUCED_MAX_WAVES = 3;
export const MAX_FLOATING_TEXT = 8;
export const REDUCED_MAX_FLOATING_TEXT = 4;
export const MAX_TRAIL_POINTS = 7;
export const REDUCED_TRAIL_POINTS = 3;
export const PERFORMANCE_PRESSURE_LIMIT = 2;
export const PERFORMANCE_PRESSURE_MAX = 8;
export const POWER_UP_DROP_CHANCE = 0.16;
export const MAX_FALLING_POWER_UPS = 4;
export const POWER_UP_FALL_SPEED = 165;
export const POWER_UP_HEIGHT = 24;
export const POWER_UP_PADDING_X = 12;
export const MAX_BALLS = 4;
export const PIERCE_DURATION = 7;
export const LEVEL_CLEAR_DURATION = 1.35;
