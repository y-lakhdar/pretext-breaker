import { LINE_HEIGHTS } from './constants';
import type { DocumentBrick } from './document-bricks';
import type { FloatingText, ImpactWave, Particle } from './types';
import type { PretextRenderer } from './pretext-renderer';
import type { createFonts } from './constants';
import { easeOutCubic, randomBetween } from './utils';

interface ParticleSystemOptions {
  renderer: PretextRenderer;
  fonts: ReturnType<typeof createFonts>;
  brickColors: readonly string[];
  shouldSimplifyEffects: () => boolean;
  getParticleLimit: () => number;
  getWaveLimit: () => number;
  getFloatingTextLimit: () => number;
}

export class ParticleSystem {
  readonly particles: Particle[] = [];
  readonly waves: ImpactWave[] = [];
  readonly floatingTexts: FloatingText[] = [];

  private readonly renderer: PretextRenderer;
  private readonly fonts: ReturnType<typeof createFonts>;
  private readonly brickColors: readonly string[];
  private readonly shouldSimplifyEffects: () => boolean;
  private readonly getParticleLimit: () => number;
  private readonly getWaveLimit: () => number;
  private readonly getFloatingTextLimit: () => number;

  constructor(options: ParticleSystemOptions) {
    this.renderer = options.renderer;
    this.fonts = options.fonts;
    this.brickColors = options.brickColors;
    this.shouldSimplifyEffects = options.shouldSimplifyEffects;
    this.getParticleLimit = options.getParticleLimit;
    this.getWaveLimit = options.getWaveLimit;
    this.getFloatingTextLimit = options.getFloatingTextLimit;
  }

  clear(): void {
    this.particles.length = 0;
    this.waves.length = 0;
    this.floatingTexts.length = 0;
  }

  emit(particle: Particle): void {
    this.particles.push(particle);
    this.trimOldest(this.particles, this.getParticleLimit());
  }

  spawnTextShatter(brick: DocumentBrick): void {
    const text = brick.element.textContent || '';
    const chars = text.replace(/\s+/g, '').split('').filter(Boolean);
    const words = text.split(/\s+/).map((word) => word.replace(/[^\w-]/g, ''))
      .filter((word) => word.length > 2 && word.length < 12);
    const simplifyEffects = this.shouldSimplifyEffects();
    const count = Math.min(simplifyEffects ? 8 : 20, Math.max(8, Math.ceil(text.length / 4)));
    const cx = brick.x + brick.width / 2;
    const cy = brick.y + brick.height / 2;

    for (let i = 0; i < count; i++) {
      const useWord = !simplifyEffects && words.length > 0 && Math.random() < 0.14;
      const textShard = useWord
        ? words[Math.floor(Math.random() * words.length)]!
        : chars[Math.floor(Math.random() * chars.length)] || '◆';
      const angle = (Math.PI * 2 * i) / count + randomBetween(-0.25, 0.45);
      const speed = randomBetween(120, 340);
      const color = Math.random() < 0.35
        ? this.brickColors[Math.floor(Math.random() * this.brickColors.length)]!
        : brick.color;

      this.emit({
        block: this.renderer.getBlock(textShard, this.fonts.particle, LINE_HEIGHTS.particle),
        x: cx + randomBetween(-0.5, 0.5) * brick.width * 0.48,
        y: cy + randomBetween(-0.5, 0.5) * brick.height * 0.48,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - randomBetween(35, 90),
        color,
        alpha: 1,
        life: 0,
        maxLife: randomBetween(0.75, 1.3),
        rotation: randomBetween(-Math.PI, Math.PI),
        angularVelocity: randomBetween(-7, 7),
        scale: useWord ? randomBetween(0.78, 1.05) : randomBetween(0.9, 1.55),
        outlined: useWord,
      });
    }
  }

  spawnImpact(x: number, y: number, color: string, intensity: number): void {
    if (this.shouldSimplifyEffects()) return;
    this.waves.push({
      x,
      y,
      color,
      life: 0,
      maxLife: randomBetween(0.35, 0.55),
      maxRadius: randomBetween(42, 88) * intensity,
      lineWidth: randomBetween(1.5, 3.5),
    });
    this.trimOldest(this.waves, this.getWaveLimit());
  }

  spawnFloatingText(x: number, y: number, text: string, color: string): void {
    const simplifyEffects = this.shouldSimplifyEffects();
    if (simplifyEffects && text.startsWith('COMBO')) return;
    this.floatingTexts.push({
      block: this.renderer.getBlock(text, this.fonts.hud, LINE_HEIGHTS.hud),
      x,
      y,
      vy: randomBetween(-72, -48),
      color,
      alpha: 1,
      life: 0,
      maxLife: simplifyEffects ? 0.65 : 0.95,
      scale: text.startsWith('COMBO') ? 1.18 : 1,
    });
    this.trimOldest(this.floatingTexts, this.getFloatingTextLimit());
  }

  update(dt: number): void {
    this.trimOldest(this.particles, this.getParticleLimit());
    this.trimOldest(this.waves, this.getWaveLimit());
    this.trimOldest(this.floatingTexts, this.getFloatingTextLimit());
    this.updateParticles(dt);
    this.updateWaves(dt);
    this.updateFloatingTexts(dt);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.drawImpactWaves(ctx);
    this.drawParticles(ctx);
    this.drawFloatingTexts(ctx);
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!;
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.swapRemove(this.particles, i);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 220 * dt;
      p.rotation += p.angularVelocity * dt;
      p.alpha = Math.pow(1 - p.life / p.maxLife, 1.25);
    }
  }

  private updateWaves(dt: number): void {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const wave = this.waves[i]!;
      wave.life += dt;
      if (wave.life >= wave.maxLife) this.swapRemove(this.waves, i);
    }
  }

  private updateFloatingTexts(dt: number): void {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const text = this.floatingTexts[i]!;
      text.life += dt;
      if (text.life >= text.maxLife) {
        this.swapRemove(this.floatingTexts, i);
        continue;
      }
      text.y += text.vy * dt;
      text.vy += 25 * dt;
      text.alpha = Math.pow(1 - text.life / text.maxLife, 1.15);
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    const simplifyEffects = this.shouldSimplifyEffects();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.scale(p.scale, p.scale);
      this.renderer.drawBlock(ctx, p.block, 0, 0, {
        alpha: p.alpha,
        align: 'center',
        verticalAlign: 'middle',
        color: p.color,
        strokeColor: p.outlined && !simplifyEffects ? 'rgba(0, 0, 0, 0.35)' : undefined,
        strokeWidth: 1.5,
      });
      ctx.restore();
    }
    ctx.restore();
  }

  private drawImpactWaves(ctx: CanvasRenderingContext2D): void {
    if (this.waves.length === 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const wave of this.waves) {
      const t = wave.life / wave.maxLife;
      const radius = easeOutCubic(t) * wave.maxRadius;
      const alpha = Math.pow(1 - t, 1.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = wave.color;
      ctx.lineWidth = wave.lineWidth;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.35;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, radius * 0.58, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  private drawFloatingTexts(ctx: CanvasRenderingContext2D): void {
    if (this.floatingTexts.length === 0) return;
    const simplifyEffects = this.shouldSimplifyEffects();
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const floatingText of this.floatingTexts) {
      ctx.save();
      ctx.translate(floatingText.x, floatingText.y);
      ctx.scale(floatingText.scale, floatingText.scale);
      this.renderer.drawBlock(ctx, floatingText.block, 0, 0, {
        alpha: floatingText.alpha,
        align: 'center',
        verticalAlign: 'middle',
        color: floatingText.color,
        strokeColor: simplifyEffects ? undefined : 'rgba(0, 0, 0, 0.45)',
        strokeWidth: 1.5,
      });
      ctx.restore();
    }
    ctx.restore();
  }

  private trimOldest<T>(items: T[], limit: number): void {
    if (items.length > limit) {
      items.copyWithin(0, items.length - limit);
      items.length = limit;
    }
  }

  private swapRemove<T>(items: T[], index: number): void {
    const last = items.pop();
    if (index < items.length && last !== undefined) items[index] = last;
  }
}
