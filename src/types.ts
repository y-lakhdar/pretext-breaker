import type { DocumentBrickSetOptions } from './document-bricks';
import type { PretextRenderer } from './pretext-renderer';
import type { TextBlock } from './pretext-renderer';
import type { createFonts } from './constants';

interface TrailPoint {
  x: number;
  y: number;
}

export interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  trail: TrailPoint[];
}

export interface Particle {
  block: TextBlock;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  angularVelocity: number;
  scale: number;
  outlined: boolean;
}

export interface ImpactWave {
  x: number;
  y: number;
  color: string;
  life: number;
  maxLife: number;
  maxRadius: number;
  lineWidth: number;
}

export interface FloatingText {
  block: TextBlock;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  scale: number;
}

export type PowerUpKind = 'multi' | 'pierce';

export interface FallingPowerUp {
  kind: PowerUpKind;
  block: TextBlock;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  life: number;
}

type Mode = 'serve' | 'playing' | 'game-over' | 'cleared' | 'level-clear' | 'level-transition';

interface PaddleState {
  x: number;
  y: number;
  width: number;
}

interface PointerState {
  active: boolean;
  x: number;
}

interface KeyState {
  left: boolean;
  right: boolean;
  launchQueued: boolean;
}

export interface GameState {
  viewWidth: number;
  viewHeight: number;
  bricks: import('./document-bricks').DocumentBrick[];
  balls: BallState[];
  powerUps: FallingPowerUp[];
  paddle: PaddleState;
  pointer: PointerState;
  keys: KeyState;
  mode: Mode;
  score: number;
  lives: number;
  initialLives: number;
  level: number;
  combo: number;
  comboTimer: number;
  pierceTime: number;
  screenShake: number;
  levelPulse: number;
  levelClearTime: number;
  elapsedTime: number;
  baseBallSpeed: number;
  reducedMotion: boolean;
  trailLimit: number;
}

export interface RenderDeps {
  renderer: PretextRenderer;
  fonts: ReturnType<typeof createFonts>;
  labels: PretextBreakerGameLabels;
  paddleBlock: TextBlock;
  particles?: Particle[];
  waves?: ImpactWave[];
  floatingTexts?: FloatingText[];
  shouldSimplifyEffects: () => boolean;
}

export interface PretextBreakerGameLabels {
  title: string;
  serveTitle: string;
  servePrompt: string;
  gameOverTitle: string;
  gameOverPrompt: (score: string) => string;
  clearedTitle: string;
  clearedPrompt: (score: string) => string;
  levelClear: string;
  reflowingLevel: (level: number) => string;
}

export interface PretextBreakerGameOptions {
  documentBricks?: DocumentBrickSetOptions;
  fontFamily?: string;
  labels?: Partial<PretextBreakerGameLabels>;
  initialLives?: number;
  baseBallSpeed?: number;
  maxCanvasDpr?: number;
}

export const defaultGameLabels: PretextBreakerGameLabels = {
  title: 'PRETEXT BREAKER',
  serveTitle: 'BREAK THE DOCS',
  servePrompt: 'Tap or press up to launch.   Left/right or mouse to move.   ESC to quit.',
  gameOverTitle: 'GAME OVER',
  gameOverPrompt: (score) => `Score: ${score}. Tap or press R to retry.`,
  clearedTitle: 'ALL CLEAR!',
  clearedPrompt: (score) => `Score: ${score}. Tap or press ESC to exit.`,
  levelClear: 'LEVEL CLEAR',
  reflowingLevel: (level) => `REFLOWING LEVEL ${level}`,
};
