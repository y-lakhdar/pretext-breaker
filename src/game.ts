import { PretextRenderer } from './pretext-renderer';
import { DOCUMENT_BRICK_COLORS, DocumentBrickSet, type DocumentBrick } from './document-bricks';
import { BASE_BALL_SPEED, DEFAULT_FONT_FAMILY, FRAME_DELTA_CAP, HUD_HEIGHT, INITIAL_LIVES, LEVEL_CLEAR_DURATION, LINE_HEIGHTS, MAX_BALLS, MAX_CANVAS_DPR, MAX_FALLING_POWER_UPS, MAX_FLOATING_TEXT, MAX_PARTICLES, MAX_TRAIL_POINTS, MAX_WAVES, PADDLE_MARGIN_BOTTOM, PADDLE_TEXT, PERFORMANCE_PRESSURE_LIMIT, PERFORMANCE_PRESSURE_MAX, PIERCE_DURATION, POWER_UP_DROP_CHANCE, POWER_UP_FALL_SPEED, POWER_UP_HEIGHT, POWER_UP_PADDING_X, REDUCED_MAX_FLOATING_TEXT, REDUCED_MAX_PARTICLES, REDUCED_MAX_WAVES, REDUCED_TRAIL_POINTS, createFonts } from './constants';
import { InputManager } from './input';
import { ParticleSystem } from './particles';
import { launchBall, updateBallPhysics, updatePaddle } from './physics';
import { renderBackground, renderBalls, renderBricks, renderPaddle, renderPowerUps, renderUI } from './game-renderer';
import type { FallingPowerUp, GameState, PowerUpKind, PretextBreakerGameLabels, PretextBreakerGameOptions } from './types';
import { defaultGameLabels } from './types';
import { randomBetween } from './utils';

export { DEFAULT_FONT_FAMILY } from './constants';
export type { PretextBreakerGameLabels, PretextBreakerGameOptions } from './types';

export class PretextBreakerGame {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly renderer = new PretextRenderer();
  private readonly documentBricks: DocumentBrickSet;
  private readonly fonts: ReturnType<typeof createFonts>;
  private readonly labels: PretextBreakerGameLabels;
  private readonly maxCanvasDpr: number;
  private readonly brickColors: readonly string[];
  private readonly paddleBlock;
  private readonly particles: ParticleSystem;
  private readonly input: InputManager;
  private readonly state: GameState;
  private dpr = 1;
  private performancePressure = 0;
  private lastTimestamp = 0;
  private animationFrame = 0;
  private destroyed = false;
  private levelTimeout: ReturnType<typeof setTimeout> | null = null;
  private onQuit: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement, options: PretextBreakerGameOptions = {}) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas context not available');
    this.ctx = ctx;
    this.fonts = createFonts(options.fontFamily ?? DEFAULT_FONT_FAMILY);
    this.labels = { ...defaultGameLabels, ...options.labels };
    this.maxCanvasDpr = options.maxCanvasDpr ?? MAX_CANVAS_DPR;
    this.brickColors = options.documentBricks?.colors?.length ? options.documentBricks.colors : DOCUMENT_BRICK_COLORS;
    const initialLives = options.initialLives ?? INITIAL_LIVES;
    this.state = { viewWidth: 0, viewHeight: 0, bricks: [], balls: [], powerUps: [],
      paddle: { x: 0, y: 0, width: 0 }, pointer: { active: false, x: 0 },
      keys: { left: false, right: false, launchQueued: false }, mode: 'serve', score: 0,
      lives: initialLives, initialLives, level: 1, combo: 0, comboTimer: 0, pierceTime: 0,
      screenShake: 0, levelPulse: 0, levelClearTime: 0, elapsedTime: 0,
      baseBallSpeed: options.baseBallSpeed ?? BASE_BALL_SPEED,
      reducedMotion: typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false,
      trailLimit: MAX_TRAIL_POINTS };
    this.documentBricks = new DocumentBrickSet(() => ({ width: this.state.viewWidth, top: HUD_HEIGHT + 4,
      bottom: this.state.viewHeight - PADDLE_MARGIN_BOTTOM - 20 }), options.documentBricks);
    this.paddleBlock = this.renderer.getBlock(PADDLE_TEXT, this.fonts.paddle, LINE_HEIGHTS.paddle, 500);
    this.state.paddle.width = this.paddleBlock.width;
    this.particles = new ParticleSystem({ renderer: this.renderer, fonts: this.fonts, brickColors: this.brickColors,
      shouldSimplifyEffects: () => this.shouldSimplifyEffects(), getParticleLimit: () => this.getParticleLimit(),
      getWaveLimit: () => this.getWaveLimit(), getFloatingTextLimit: () => this.getFloatingTextLimit() });
    this.input = new InputManager({ canvas: this.canvas, state: this.state, onResize: this.resize,
      onRestart: () => this.restart(), onQuit: () => this.onQuit?.() });
    this.resize();
    this.state.bricks = this.documentBricks.extract();
    this.state.paddle.x = this.state.viewWidth / 2;
    this.state.paddle.y = this.state.viewHeight - PADDLE_MARGIN_BOTTOM;
    this.input.attach();
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  setOnQuit(fn: () => void): void {
    this.onQuit = fn;
  }

  destroy(): void {
    this.destroyed = true;
    this.input.detach();
    if (this.levelTimeout !== null) clearTimeout(this.levelTimeout);
    this.documentBricks.restore();
    cancelAnimationFrame(this.animationFrame);
    this.renderer.clear();
  }

  private readonly resize = (): void => {
    this.dpr = Math.min(window.devicePixelRatio || 1, this.maxCanvasDpr);
    this.state.viewWidth = window.innerWidth;
    this.state.viewHeight = window.innerHeight;
    this.canvas.width = this.state.viewWidth * this.dpr;
    this.canvas.height = this.state.viewHeight * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.state.paddle.y = this.state.viewHeight - PADDLE_MARGIN_BOTTOM;
    this.documentBricks.refreshPositions();
  };

  private shouldSimplifyEffects(): boolean {
    return this.state.reducedMotion || this.performancePressure >= PERFORMANCE_PRESSURE_LIMIT;
  }

  private getParticleLimit(): number {
    return this.shouldSimplifyEffects() ? REDUCED_MAX_PARTICLES : MAX_PARTICLES;
  }

  private getWaveLimit(): number {
    return this.shouldSimplifyEffects() ? REDUCED_MAX_WAVES : MAX_WAVES;
  }

  private getFloatingTextLimit(): number {
    return this.shouldSimplifyEffects() ? REDUCED_MAX_FLOATING_TEXT : MAX_FLOATING_TEXT;
  }

  private getTrailLimit(): number {
    return this.shouldSimplifyEffects() ? REDUCED_TRAIL_POINTS : MAX_TRAIL_POINTS;
  }

  private updatePerformancePressure(rawDelta: number): void {
    if (rawDelta <= 0) return;
    if (rawDelta > 1 / 30) {
      this.performancePressure = Math.min(PERFORMANCE_PRESSURE_MAX, this.performancePressure + 1.25);
    } else if (rawDelta > 1 / 45) {
      this.performancePressure = Math.min(PERFORMANCE_PRESSURE_MAX, this.performancePressure + 0.45);
    } else {
      this.performancePressure = Math.max(0, this.performancePressure - 0.04);
    }
  }

  private readonly frame = (timestamp: number): void => {
    if (this.destroyed) return;
    const rawDelta = this.lastTimestamp === 0 ? 0 : (timestamp - this.lastTimestamp) / 1000;
    this.lastTimestamp = timestamp;
    this.updatePerformancePressure(rawDelta);
    this.update(Math.min(rawDelta, FRAME_DELTA_CAP));
    this.render();
    this.animationFrame = requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    this.state.trailLimit = this.getTrailLimit();
    this.state.elapsedTime += dt;
    this.particles.update(dt);
    this.updatePowerUps(dt);
    this.updateTimers(dt);
    this.updateBrickHitFlash(dt);

    if (this.state.mode === 'serve') {
      updatePaddle(this.state, dt);
      if (this.state.keys.launchQueued) {
        launchBall(this.state);
        this.state.mode = 'playing';
        this.state.keys.launchQueued = false;
      }
      return;
    }
    if (this.state.mode === 'level-clear') {
      this.state.keys.launchQueued = false;
      updatePaddle(this.state, dt);
      return;
    }
    if (this.state.mode === 'level-transition') {
      updatePaddle(this.state, dt);
      return;
    }
    if (this.state.mode === 'game-over') {
      if (this.state.keys.launchQueued) {
        this.state.keys.launchQueued = false;
        this.restart();
      }
      return;
    }
    if (this.state.mode === 'cleared') {
      if (this.state.keys.launchQueued) {
        this.state.keys.launchQueued = false;
        this.onQuit?.();
      }
      return;
    }

    this.state.keys.launchQueued = false;
    updatePaddle(this.state, dt);
    const lastLostX = updateBallPhysics(this.state, dt, {
      onPaddleHit: (_ball, x, y) => {
        this.state.screenShake = Math.max(this.state.screenShake, this.state.reducedMotion ? 1 : 2);
        this.particles.spawnImpact(x, y, '#95edff', 0.65);
      },
      onBrickHit: (brick) => this.handleBrickHit(brick),
    });

    if (this.state.bricks.every((b) => !b.alive)) this.beginNextLevel();
    else if (this.state.balls.length === 0) this.loseLife(lastLostX ?? this.state.paddle.x);
  }

  private updateTimers(dt: number): void {
    this.state.pierceTime = Math.max(0, this.state.pierceTime - dt);
    this.state.screenShake *= Math.max(0, 1 - dt * 8);
    this.state.levelPulse = Math.max(0, this.state.levelPulse - dt * 1.8);
    if (this.state.mode === 'level-clear') {
      this.state.levelClearTime = Math.min(LEVEL_CLEAR_DURATION, this.state.levelClearTime + dt);
    }
    if (this.state.comboTimer > 0) {
      this.state.comboTimer = Math.max(0, this.state.comboTimer - dt);
      if (this.state.comboTimer === 0) this.state.combo = 0;
    }
  }

  private updateBrickHitFlash(dt: number): void {
    for (const brick of this.state.bricks) {
      if (brick.hitFlash > 0) brick.hitFlash = Math.max(0, brick.hitFlash - dt * 3);
    }
  }

  private handleBrickHit(brick: DocumentBrick): void {
    this.registerBrickHit(brick);
    this.state.screenShake = Math.max(this.state.screenShake, this.state.reducedMotion ? 2 : 5);
    this.particles.spawnTextShatter(brick);
    this.particles.spawnImpact(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 1);
    this.maybeSpawnPowerUp(brick);
    this.documentBricks.hide(brick);
  }

  private registerBrickHit(brick: DocumentBrick): void {
    this.state.combo = this.state.comboTimer > 0 ? this.state.combo + 1 : 1;
    this.state.comboTimer = 1.8;
    const comboBonus = this.state.combo > 1 ? Math.min(250, (this.state.combo - 1) * 8) : 0;
    const earned = brick.value + comboBonus;
    this.state.score += earned;
    this.particles.spawnFloatingText(
      brick.x + brick.width / 2,
      brick.y + brick.height / 2,
      this.state.combo >= 3 ? `COMBO x${this.state.combo}` : `+${earned}`,
      comboBonus > 0 ? '#ffdd99' : brick.color,
    );
  }

  private maybeSpawnPowerUp(brick: DocumentBrick): void {
    if (this.state.powerUps.length >= MAX_FALLING_POWER_UPS || Math.random() > POWER_UP_DROP_CHANCE) return;
    const kind: PowerUpKind = Math.random() < 0.55 ? 'multi' : 'pierce';
    const label = kind === 'multi' ? '[MULTI]' : '[PIERCE]';
    const block = this.renderer.getBlock(label, this.fonts.hud, LINE_HEIGHTS.hud);
    this.state.powerUps.push({
      kind,
      block,
      x: brick.x + brick.width / 2,
      y: brick.y + brick.height / 2,
      vy: POWER_UP_FALL_SPEED + randomBetween(-18, 28),
      width: block.width + POWER_UP_PADDING_X * 2,
      height: POWER_UP_HEIGHT,
      color: kind === 'multi' ? '#95edff' : '#a4f094',
      life: 0,
    });
  }

  private updatePowerUps(dt: number): void {
    const paddleHalf = this.state.paddle.width / 2;
    const paddleLeft = this.state.paddle.x - paddleHalf;
    const paddleRight = this.state.paddle.x + paddleHalf;
    const paddleTop = this.state.paddle.y - 12;
    for (let i = this.state.powerUps.length - 1; i >= 0; i--) {
      const powerUp = this.state.powerUps[i]!;
      powerUp.life += dt;
      powerUp.y += powerUp.vy * dt;
      powerUp.x += Math.sin(powerUp.life * 5) * 10 * dt;
      const caught = powerUp.y + powerUp.height / 2 >= paddleTop &&
        powerUp.y - powerUp.height / 2 <= paddleTop + 26 &&
        powerUp.x + powerUp.width / 2 >= paddleLeft &&
        powerUp.x - powerUp.width / 2 <= paddleRight;
      if (caught) {
        this.applyPowerUp(powerUp);
        this.state.powerUps.splice(i, 1);
      } else if (powerUp.y - powerUp.height / 2 > this.state.viewHeight) {
        this.state.powerUps.splice(i, 1);
      }
    }
  }

  private applyPowerUp(powerUp: FallingPowerUp): void {
    if (powerUp.kind === 'multi') this.activateMultiBall(powerUp.x, powerUp.y);
    else {
      this.state.pierceTime = Math.max(this.state.pierceTime, PIERCE_DURATION);
      this.particles.spawnFloatingText(powerUp.x, powerUp.y, 'PIERCE', powerUp.color);
      this.particles.spawnImpact(powerUp.x, powerUp.y, powerUp.color, 0.8);
    }
    this.state.screenShake = Math.max(this.state.screenShake, this.state.reducedMotion ? 1 : 3);
  }

  private activateMultiBall(x: number, y: number): void {
    if (this.state.balls.length === 0 || this.state.balls.length >= MAX_BALLS) {
      this.particles.spawnFloatingText(x, y, 'MULTI MAX', '#95edff');
      return;
    }
    const sources = [...this.state.balls];
    let created = 0;
    for (const source of sources) {
      if (this.state.balls.length >= MAX_BALLS) break;
      const angle = Math.atan2(source.vy, source.vx) + (created % 2 === 0 ? -0.45 : 0.45);
      this.state.balls.push({ x: source.x, y: source.y, vx: Math.cos(angle) * source.speed, vy: Math.sin(angle) * source.speed, speed: source.speed, trail: [] });
      created++;
    }
    if (created > 0) {
      this.particles.spawnFloatingText(x, y, `MULTI x${this.state.balls.length}`, '#95edff');
      this.particles.spawnImpact(x, y, '#95edff', 0.9);
    }
  }

  private restart(): void {
    if (this.levelTimeout !== null) clearTimeout(this.levelTimeout);
    this.levelTimeout = null;
    this.documentBricks.restore();
    this.state.level = 1;
    this.state.score = 0;
    this.state.lives = this.state.initialLives;
    this.state.balls = [];
    this.particles.clear();
    this.state.powerUps = [];
    this.state.combo = 0;
    this.state.comboTimer = 0;
    this.state.pierceTime = 0;
    this.state.levelPulse = 0;
    this.state.levelClearTime = 0;
    this.state.bricks = this.documentBricks.extract();
    this.state.mode = 'serve';
  }

  private loseLife(lastBallX: number): void {
    this.state.lives--;
    this.state.combo = 0;
    this.state.comboTimer = 0;
    this.state.powerUps = [];
    this.state.pierceTime = 0;
    this.state.screenShake = 6;
    if (this.state.lives <= 0) this.state.mode = 'game-over';
    else {
      this.state.mode = 'serve';
      this.state.paddle.x = lastBallX;
    }
  }

  private beginNextLevel(): void {
    this.state.level++;
    this.state.balls = [];
    this.particles.clear();
    this.state.powerUps = [];
    this.state.combo = 0;
    this.state.comboTimer = 0;
    this.state.pierceTime = 0;
    this.state.mode = 'level-clear';
    this.state.levelPulse = 1;
    this.state.levelClearTime = 0;
    this.particles.spawnImpact(this.state.viewWidth / 2, (HUD_HEIGHT + this.state.viewHeight) / 2, '#95edff', 1.4);
    this.particles.spawnFloatingText(this.state.viewWidth / 2, (HUD_HEIGHT + this.state.viewHeight) / 2, this.labels.levelClear, '#ffdd99');
    this.documentBricks.restore();
    this.levelTimeout = setTimeout(() => {
      if (this.destroyed) return;
      this.state.bricks = this.documentBricks.extract();
      this.state.levelClearTime = 0;
      this.state.mode = this.state.bricks.length > 0 ? 'serve' : 'cleared';
      this.levelTimeout = null;
    }, this.state.reducedMotion ? 500 : LEVEL_CLEAR_DURATION * 1000);
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.state.viewWidth, this.state.viewHeight);
    const shakeScale = this.state.reducedMotion ? 0.3 : 1;
    const shakeX = (Math.random() - 0.5) * this.state.screenShake * 2.5 * shakeScale;
    const shakeY = (Math.random() - 0.5) * this.state.screenShake * 2 * shakeScale;
    const deps = { renderer: this.renderer, fonts: this.fonts, labels: this.labels,
      paddleBlock: this.paddleBlock, shouldSimplifyEffects: () => this.shouldSimplifyEffects() };
    ctx.save();
    ctx.translate(shakeX, shakeY);
    this.particles.render(ctx);
    renderBackground(ctx, this.state, deps);
    renderBricks(ctx, this.state, deps);
    renderPaddle(ctx, this.state, deps);
    renderBalls(ctx, this.state);
    renderPowerUps(ctx, this.state, deps);
    renderUI(ctx, this.state, deps);
    ctx.restore();
  }
}
