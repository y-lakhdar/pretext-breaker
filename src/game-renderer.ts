import { BALL_RADIUS, HUD_HEIGHT, LEVEL_CLEAR_DURATION, LINE_HEIGHTS } from './constants';
import type { BallState, GameState, RenderDeps } from './types';
import { clamp, drawRoundedRect, easeOutCubic, formatScore } from './utils';

export function renderBackground(ctx: CanvasRenderingContext2D, state: GameState, deps: RenderDeps): void {
  for (const brick of state.bricks) {
    if (!brick.alive && brick.hitFlash <= 0) continue;
    const pulse = state.reducedMotion ? 1 : 0.86 + Math.sin(state.elapsedTime * 4.5 + brick.x * 0.018) * 0.14;
    const alpha = (brick.alive ? 0.58 : brick.hitFlash) * pulse;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = brick.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(brick.x - 2, brick.y - 2, brick.width + 4, brick.height + 4);
    ctx.globalAlpha = alpha * 0.45;
    ctx.lineWidth = 1;
    ctx.strokeRect(brick.x + 3, brick.y + 3, brick.width - 6, brick.height - 6);
    ctx.globalAlpha = alpha * 0.06;
    ctx.fillStyle = brick.color;
    ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
    ctx.restore();
  }
  drawLevelPulse(ctx, state);
  drawLevelClearAnimation(ctx, state, deps);
}

export function renderPaddle(ctx: CanvasRenderingContext2D, state: GameState, deps: RenderDeps): void {
  const halfW = state.paddle.width / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 20, 30, 0.55)';
  ctx.beginPath();
  drawRoundedRect(ctx, state.paddle.x - halfW - 6, state.paddle.y - 9, state.paddle.width + 12, 18, 4);
  ctx.fill();
  ctx.restore();
  deps.renderer.drawBlock(ctx, deps.paddleBlock, state.paddle.x, state.paddle.y, {
    align: 'center',
    verticalAlign: 'middle',
    color: '#95edff',
  });
}

export function renderBalls(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.mode === 'serve') {
    drawBallBody(ctx, state.paddle.x, state.paddle.y - BALL_RADIUS - 8, state.pierceTime);
    return;
  }
  for (const ball of state.balls) {
    drawBallTrail(ctx, ball);
    drawBallBody(ctx, ball.x, ball.y, state.pierceTime);
  }
}

export function renderBricks(_ctx: CanvasRenderingContext2D, _state: GameState, _deps: RenderDeps): void {}

export function renderPowerUps(ctx: CanvasRenderingContext2D, state: GameState, deps: RenderDeps): void {
  for (const powerUp of state.powerUps) {
    const bob = Math.sin(powerUp.life * 7) * 2;
    const x = powerUp.x - powerUp.width / 2;
    const y = powerUp.y - powerUp.height / 2 + bob;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = 'rgba(15, 20, 30, 0.82)';
    ctx.strokeStyle = powerUp.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    drawRoundedRect(ctx, x, y, powerUp.width, powerUp.height, 5);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = powerUp.color;
    ctx.fillRect(x + 3, y + 3, powerUp.width - 6, powerUp.height - 6);
    ctx.restore();
    deps.renderer.drawBlock(ctx, powerUp.block, powerUp.x, powerUp.y + bob, {
      align: 'center',
      verticalAlign: 'middle',
      color: powerUp.color,
    });
  }
}

export function renderUI(ctx: CanvasRenderingContext2D, state: GameState, deps: RenderDeps): void {
  drawHUD(ctx, state, deps);
  if (state.mode === 'serve' || state.mode === 'game-over' || state.mode === 'cleared') {
    drawOverlay(ctx, state, deps);
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, state: GameState, deps: RenderDeps): void {
  ctx.save();
  ctx.fillStyle = 'rgba(63, 63, 113, 0.86)';
  ctx.fillRect(0, 0, state.viewWidth, HUD_HEIGHT);
  ctx.strokeStyle = 'rgba(149, 237, 255, 0.34)';
  ctx.beginPath();
  ctx.moveTo(0, HUD_HEIGHT);
  ctx.lineTo(state.viewWidth, HUD_HEIGHT);
  ctx.stroke();
  ctx.restore();

  const title = deps.renderer.getBlock(deps.labels.title, deps.fonts.title, LINE_HEIGHTS.title);
  deps.renderer.drawBlock(ctx, title, 20, 12, { color: '#f8f4e4' });
  const hearts = '♥'.repeat(state.lives) + '♡'.repeat(Math.max(0, state.initialLives - state.lives));
  const info = `SCORE ${formatScore(state.score)}   ${hearts}   LVL ${state.level.toString().padStart(2, '0')}`;
  const infoBlock = deps.renderer.getBlock(info, deps.fonts.hud, LINE_HEIGHTS.hud, state.viewWidth - 40);
  deps.renderer.drawBlock(ctx, infoBlock, state.viewWidth - 20, 18, { align: 'right', color: '#ffdd99' });
  if (state.combo > 1) {
    const combo = deps.renderer.getBlock(`COMBO x${state.combo}`, deps.fonts.hud, LINE_HEIGHTS.hud);
    deps.renderer.drawBlock(ctx, combo, state.viewWidth / 2, 18, { align: 'center', color: '#95edff' });
  }
  if (state.pierceTime > 0) {
    const pierce = deps.renderer.getBlock(`PIERCE ${Math.ceil(state.pierceTime)}s`, deps.fonts.hud, LINE_HEIGHTS.hud);
    deps.renderer.drawBlock(ctx, pierce, state.combo > 1 ? state.viewWidth / 2 - 128 : state.viewWidth / 2, 34, {
      align: 'center',
      color: '#a4f094',
    });
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, state: GameState, deps: RenderDeps): void {
  const cx = state.viewWidth / 2;
  const cy = (HUD_HEIGHT + state.viewHeight) / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(15, 20, 30, 0.34)';
  ctx.fillRect(0, HUD_HEIGHT, state.viewWidth, state.viewHeight - HUD_HEIGHT);
  if (!deps.shouldSimplifyEffects()) {
    ctx.globalAlpha = 0.12 + Math.sin(state.elapsedTime * 3.5) * 0.04;
    ctx.strokeStyle = '#95edff';
    for (let y = HUD_HEIGHT + (state.elapsedTime * 90) % 24; y < state.viewHeight; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(state.viewWidth, y);
      ctx.stroke();
    }
  }
  ctx.restore();
  const mainText = state.mode === 'cleared' ? deps.labels.clearedTitle : state.mode === 'game-over' ? deps.labels.gameOverTitle : deps.labels.serveTitle;
  const subText = state.mode === 'cleared'
    ? deps.labels.clearedPrompt(formatScore(state.score))
    : state.mode === 'game-over'
      ? deps.labels.gameOverPrompt(formatScore(state.score))
      : deps.labels.servePrompt;
  const mainBlock = deps.renderer.getBlock(mainText, deps.fonts.overlay, LINE_HEIGHTS.overlay, state.viewWidth - 80);
  const subBlock = deps.renderer.getBlock(subText, deps.fonts.overlaySub, LINE_HEIGHTS.overlaySub, state.viewWidth - 80);
  const pillW = Math.max(mainBlock.width, subBlock.width) + 60;
  const pillH = mainBlock.height + subBlock.height + 36;
  ctx.save();
  const glow = state.reducedMotion ? 0.12 : 0.16 + Math.sin(state.elapsedTime * 5) * 0.05;
  ctx.fillStyle = 'rgba(15, 20, 30, 0.76)';
  ctx.beginPath();
  drawRoundedRect(ctx, cx - pillW / 2, cy - pillH / 2, pillW, pillH, 10);
  ctx.fill();
  ctx.strokeStyle = `rgba(149, 237, 255, ${0.26 + glow})`;
  ctx.stroke();
  ctx.restore();
  deps.renderer.drawBlock(ctx, mainBlock, cx, cy - 16, { align: 'center', verticalAlign: 'middle', color: '#f8f4e4' });
  deps.renderer.drawBlock(ctx, subBlock, cx, cy + mainBlock.height / 2 + 8, { align: 'center', verticalAlign: 'top', color: '#95edff' });
}

function drawBallTrail(ctx: CanvasRenderingContext2D, ball: BallState): void {
  if (ball.trail.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < ball.trail.length; i++) {
    const point = ball.trail[i]!;
    const t = (i + 1) / ball.trail.length;
    ctx.beginPath();
    ctx.arc(point.x, point.y, BALL_RADIUS * (0.4 + t * 0.8), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(149, 237, 255, ${t * 0.24})`;
    ctx.fill();
  }
  ctx.restore();
}

function drawBallBody(ctx: CanvasRenderingContext2D, x: number, y: number, pierceTime: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS + 8, 0, Math.PI * 2);
  ctx.fillStyle = pierceTime > 0 ? 'rgba(164, 240, 148, 0.18)' : 'rgba(242, 197, 107, 0.16)';
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = pierceTime > 0 ? '#a4f094' : '#f2c56b';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawLevelPulse(ctx: CanvasRenderingContext2D, state: GameState): void {
  if (state.levelPulse <= 0) return;
  const cx = state.viewWidth / 2;
  const cy = (HUD_HEIGHT + state.viewHeight) / 2;
  const radius = easeOutCubic(1 - state.levelPulse) * Math.max(state.viewWidth, state.viewHeight);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, `rgba(149, 237, 255, ${state.levelPulse * 0.18})`);
  gradient.addColorStop(0.5, `rgba(242, 197, 107, ${state.levelPulse * 0.08})`);
  gradient.addColorStop(1, 'rgba(149, 237, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, HUD_HEIGHT, state.viewWidth, state.viewHeight - HUD_HEIGHT);
  ctx.globalAlpha = state.levelPulse * 0.22;
  ctx.strokeStyle = '#95edff';
  for (let y = HUD_HEIGHT + (state.elapsedTime * 180) % 18; y < state.viewHeight; y += 18) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(state.viewWidth, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLevelClearAnimation(ctx: CanvasRenderingContext2D, state: GameState, deps: RenderDeps): void {
  if (state.mode !== 'level-clear') return;
  const t = clamp(state.levelClearTime / LEVEL_CLEAR_DURATION, 0, 1);
  const eased = easeOutCubic(t);
  const cx = state.viewWidth / 2;
  const cy = (HUD_HEIGHT + state.viewHeight) / 2;
  const clearBlock = deps.renderer.getBlock(deps.labels.levelClear, deps.fonts.overlay, LINE_HEIGHTS.overlay, state.viewWidth - 80);
  const subBlock = deps.renderer.getBlock(deps.labels.reflowingLevel(state.level), deps.fonts.overlaySub, LINE_HEIGHTS.overlaySub, state.viewWidth - 80);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.14 * (1 - t * 0.35);
  ctx.fillStyle = '#95edff';
  ctx.fillRect(0, HUD_HEIGHT, state.viewWidth, state.viewHeight - HUD_HEIGHT);
  ctx.globalAlpha = 0.38 * (1 - t * 0.3);
  ctx.fillStyle = '#ffdd99';
  ctx.fillRect(0, HUD_HEIGHT + eased * (state.viewHeight - HUD_HEIGHT) - 2, state.viewWidth, 4);
  ctx.restore();
  const wordAlpha = t < 0.82 ? 1 : clamp((1 - t) / 0.18, 0, 1);
  ctx.save();
  ctx.translate(cx, cy - 10);
  ctx.scale(1 + Math.sin(t * Math.PI) * 0.06, 1);
  deps.renderer.drawBlock(ctx, clearBlock, 0, 0, { alpha: wordAlpha, align: 'center', verticalAlign: 'middle', color: '#f8f4e4', strokeColor: 'rgba(0, 0, 0, 0.45)', strokeWidth: 2 });
  ctx.restore();
  deps.renderer.drawBlock(ctx, subBlock, cx, cy + clearBlock.height / 2 + 16, { alpha: wordAlpha * 0.92, align: 'center', verticalAlign: 'top', color: '#95edff' });
}
