import type { GameState } from './types';

interface InputManagerOptions {
  canvas: HTMLCanvasElement;
  state: GameState;
  onResize: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export class InputManager {
  private readonly canvas: HTMLCanvasElement;
  private readonly state: GameState;
  private readonly onResize: () => void;
  private readonly onRestart: () => void;
  private readonly onQuit: () => void;

  constructor(options: InputManagerOptions) {
    this.canvas = options.canvas;
    this.state = options.state;
    this.onResize = options.onResize;
    this.onRestart = options.onRestart;
    this.onQuit = options.onQuit;
  }

  attach(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointercancel', this.onPointerUp);
    this.canvas.style.touchAction = 'none';
  }

  detach(): void {
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    this.canvas.removeEventListener('pointermove', this.onPointerMove);
    this.canvas.removeEventListener('pointerup', this.onPointerUp);
    this.canvas.removeEventListener('pointercancel', this.onPointerUp);
  }

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.state.keys.left = true;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.state.keys.right = true;
    if (e.code === 'ArrowUp' || e.code === 'Enter' || e.code === 'Space') {
      e.preventDefault();
      this.state.keys.launchQueued = true;
    }
    if (e.code === 'KeyR' && this.state.mode === 'game-over') this.onRestart();
    if (e.code === 'Escape') this.onQuit();
  };

  private readonly onKeyUp = (e: KeyboardEvent): void => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.state.keys.left = false;
    if (e.code === 'ArrowRight' || e.code === 'KeyD') this.state.keys.right = false;
  };

  private readonly onPointerDown = (e: PointerEvent): void => {
    this.state.pointer.active = true;
    this.state.pointer.x = e.clientX;
    this.state.keys.launchQueued = true;
  };

  private readonly onPointerMove = (e: PointerEvent): void => {
    if (!this.state.pointer.active) return;
    this.state.pointer.x = e.clientX;
  };

  private readonly onPointerUp = (): void => {
    this.state.pointer.active = false;
  };
}
