import { BALL_RADIUS, HUD_HEIGHT, PADDLE_KEYBOARD_SPEED } from './constants';
import type { BallState, GameState } from './types';
import type { DocumentBrick } from './document-bricks';
import { clamp, lerp } from './utils';

export interface PhysicsHooks {
  onPaddleHit?: (ball: BallState, x: number, y: number) => void;
  onBrickHit?: (brick: DocumentBrick, ball: BallState) => void;
}

export function updatePaddle(state: GameState, dt: number): void {
  if (state.pointer.active) {
    state.paddle.x = lerp(state.paddle.x, state.pointer.x, Math.min(1, dt * 14));
  } else {
    if (state.keys.left) state.paddle.x -= PADDLE_KEYBOARD_SPEED * dt;
    if (state.keys.right) state.paddle.x += PADDLE_KEYBOARD_SPEED * dt;
  }

  const half = state.paddle.width / 2;
  state.paddle.x = clamp(state.paddle.x, half + 8, state.viewWidth - half - 8);
}

function getCurrentSpeed(state: GameState): number {
  return state.baseBallSpeed * (1 + (state.level - 1) * 0.08);
}

export function launchBall(state: GameState): void {
  const speed = getCurrentSpeed(state);
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
  state.balls.push({
    x: state.paddle.x,
    y: state.paddle.y - BALL_RADIUS - 6,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    speed,
    trail: [],
  });
}

export function updateBallPhysics(state: GameState, dt: number, hooks: PhysicsHooks = {}): number | null {
  let lastLostX: number | null = null;

  for (let i = state.balls.length - 1; i >= 0; i--) {
    const ball = state.balls[i]!;
    ball.speed = getCurrentSpeed(state);
    ball.trail.push({ x: ball.x, y: ball.y });
    while (ball.trail.length > state.trailLimit) ball.trail.shift();

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - BALL_RADIUS < 0) {
      ball.x = BALL_RADIUS;
      ball.vx = Math.abs(ball.vx);
    }
    if (ball.x + BALL_RADIUS > state.viewWidth) {
      ball.x = state.viewWidth - BALL_RADIUS;
      ball.vx = -Math.abs(ball.vx);
    }
    if (ball.y - BALL_RADIUS < HUD_HEIGHT) {
      ball.y = HUD_HEIGHT + BALL_RADIUS;
      ball.vy = Math.abs(ball.vy);
    }

    if (ball.y - BALL_RADIUS > state.viewHeight) {
      lastLostX = ball.x;
      state.balls.splice(i, 1);
      continue;
    }

    checkPaddleCollision(state, ball, hooks);
    checkBrickCollisions(state, ball, hooks);
  }

  return lastLostX;
}

function checkPaddleCollision(state: GameState, ball: BallState, hooks: PhysicsHooks = {}): void {
  const paddleHalf = state.paddle.width / 2;
  const paddleLeft = state.paddle.x - paddleHalf;
  const paddleRight = state.paddle.x + paddleHalf;
  const paddleTop = state.paddle.y - 8;

  if (
    ball.vy > 0 &&
    ball.y + BALL_RADIUS > paddleTop &&
    ball.y + BALL_RADIUS < paddleTop + 24 &&
    ball.x > paddleLeft - BALL_RADIUS &&
    ball.x < paddleRight + BALL_RADIUS
  ) {
    ball.y = paddleTop - BALL_RADIUS;
    const hitPos = (ball.x - state.paddle.x) / paddleHalf;
    const angle = -Math.PI / 2 + hitPos * 0.7;
    ball.vx = Math.cos(angle) * ball.speed;
    ball.vy = Math.sin(angle) * ball.speed;
    hooks.onPaddleHit?.(ball, ball.x, paddleTop);
  }
}

function checkBrickCollisions(state: GameState, ball: BallState, hooks: PhysicsHooks = {}): void {
  const isPiercing = state.pierceTime > 0;
  for (const brick of state.bricks) {
    if (!brick.alive) continue;
    if (!overlapsBrick(ball, brick)) continue;

    brick.alive = false;
    brick.hitFlash = 1;
    hooks.onBrickHit?.(brick, ball);
    if (isPiercing) continue;
    bounceFromBrick(ball, brick);
    break;
  }
}

function overlapsBrick(ball: BallState, brick: DocumentBrick): boolean {
  return ball.x + BALL_RADIUS > brick.x &&
    ball.x - BALL_RADIUS < brick.x + brick.width &&
    ball.y + BALL_RADIUS > brick.y &&
    ball.y - BALL_RADIUS < brick.y + brick.height;
}

function bounceFromBrick(ball: BallState, brick: DocumentBrick): void {
  const overlapLeft = ball.x + BALL_RADIUS - brick.x;
  const overlapRight = brick.x + brick.width - (ball.x - BALL_RADIUS);
  const overlapTop = ball.y + BALL_RADIUS - brick.y;
  const overlapBottom = brick.y + brick.height - (ball.y - BALL_RADIUS);
  const min = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  if (min === overlapLeft) {
    ball.x = brick.x - BALL_RADIUS - 1;
    ball.vx = -Math.abs(ball.vx);
  } else if (min === overlapRight) {
    ball.x = brick.x + brick.width + BALL_RADIUS + 1;
    ball.vx = Math.abs(ball.vx);
  } else if (min === overlapTop) {
    ball.y = brick.y - BALL_RADIUS - 1;
    ball.vy = -Math.abs(ball.vy);
  } else {
    ball.y = brick.y + brick.height + BALL_RADIUS + 1;
    ball.vy = Math.abs(ball.vy);
  }
}
