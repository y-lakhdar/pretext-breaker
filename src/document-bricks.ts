export const contentBrickSelector =
  'h1, h2, h3, h4, h5, h6, p, li, pre, blockquote, td, th, dt, dd, summary';

export const navigationBrickSelector = [
  'a[href]',
  'button',
  '[role="link"]',
  '[role="treeitem"]',
].join(', ');

export interface DocumentBrickSource {
  rootSelector: string;
  itemSelector: string;
}

export const genericBrickSources: readonly DocumentBrickSource[] = [
  {
    rootSelector: 'main, article, [role="main"], body',
    itemSelector: contentBrickSelector,
  },
];

export const defaultBrickSources = genericBrickSources;

export const DOCUMENT_BRICK_COLORS = [
  '#f2c56b', '#ff8d6b', '#75d7e6', '#a4f094',
  '#d4a0f0', '#ffb38f', '#9ad6ff', '#ddffd7',
] as const;

export interface DocumentBrick {
  element: HTMLElement;
  alive: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  value: number;
  originalOpacity: string;
  originalTransition: string;
  originalTransform: string;
  originalFilter: string;
  hitFlash: number;
}

export interface DocumentBrickPlayArea {
  width: number;
  top: number;
  bottom: number;
}

export interface DocumentBrickSetOptions {
  sources?: readonly DocumentBrickSource[];
  fallbackSelector?: string;
  colors?: readonly string[];
  minWidth?: number;
  minHeight?: number;
  valueForElement?: (element: HTMLElement, text: string) => number;
}

export class DocumentBrickSet {
  private bricks: DocumentBrick[] = [];
  private readonly sources: readonly DocumentBrickSource[];
  private readonly fallbackSelector: string;
  private readonly colors: readonly string[];
  private readonly minWidth: number;
  private readonly minHeight: number;
  private readonly valueForElement: (element: HTMLElement, text: string) => number;

  constructor(
    private readonly getPlayArea: () => DocumentBrickPlayArea,
    options: DocumentBrickSetOptions = {},
  ) {
    this.sources = options.sources ?? defaultBrickSources;
    this.fallbackSelector = options.fallbackSelector ?? contentBrickSelector;
    this.colors = options.colors?.length ? options.colors : DOCUMENT_BRICK_COLORS;
    this.minWidth = options.minWidth ?? 30;
    this.minHeight = options.minHeight ?? 8;
    this.valueForElement = options.valueForElement ?? ((_element, text) => (
      Math.max(10, Math.min(100, Math.round(text.length * 1.5)))
    ));
  }

  extract(): DocumentBrick[] {
    this.restore();

    const candidates = this.collectCandidates();
    const leaves = candidates.filter(
      (element) => !candidates.some((other) => other !== element && element.contains(other)),
    );
    const playArea = this.getPlayArea();
    const bricks: DocumentBrick[] = [];

    for (const element of leaves) {
      const rect = element.getBoundingClientRect();

      if (!this.isVisible(element, rect, playArea)) continue;

      const text = element.textContent?.replace(/\s+/g, ' ').trim() || '';
      if (!text) continue;

      bricks.push({
        element,
        alive: true,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        color: this.colors[bricks.length % this.colors.length] ?? DOCUMENT_BRICK_COLORS[0],
        value: this.valueForElement(element, text),
        originalOpacity: element.style.opacity,
        originalTransition: element.style.transition,
        originalTransform: element.style.transform,
        originalFilter: element.style.filter,
        hitFlash: 0,
      });
    }

    this.bricks = bricks;
    return this.bricks;
  }

  restore(): void {
    for (const brick of this.bricks) {
      brick.element.style.transition = brick.originalTransition;
      brick.element.style.opacity = brick.originalOpacity;
      brick.element.style.transform = brick.originalTransform;
      brick.element.style.filter = brick.originalFilter;
    }
  }

  refreshPositions(): void {
    for (const brick of this.bricks) {
      if (!brick.alive) continue;
      const rect = brick.element.getBoundingClientRect();
      brick.x = rect.left;
      brick.y = rect.top;
      brick.width = rect.width;
      brick.height = rect.height;
    }
  }

  hide(brick: DocumentBrick): void {
    brick.element.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    brick.element.style.opacity = '0';
    brick.element.style.transform = brick.originalTransform && brick.originalTransform !== 'none'
      ? `${brick.originalTransform} scale(0.94)`
      : 'scale(0.94)';
    brick.element.style.filter = brick.originalFilter;
  }

  private collectCandidates(): HTMLElement[] {
    const candidates = new Set<HTMLElement>();

    for (const source of this.sources) {
      const roots = Array.from(document.querySelectorAll(source.rootSelector));
      for (const root of roots) {
        if (!(root instanceof HTMLElement)) continue;
        const elements = Array.from(root.querySelectorAll(source.itemSelector));
        for (const element of elements) {
          if (element instanceof HTMLElement) candidates.add(element);
        }
      }
    }

    if (candidates.size === 0) {
      const elements = Array.from(document.body.querySelectorAll(this.fallbackSelector));
      for (const element of elements) {
        if (element instanceof HTMLElement) candidates.add(element);
      }
    }

    return Array.from(candidates);
  }

  private isVisible(
    element: HTMLElement,
    rect: DOMRect,
    playArea: DocumentBrickPlayArea,
  ): boolean {
    if (rect.width < this.minWidth || rect.height < this.minHeight) return false;
    if (rect.right < 0 || rect.left > playArea.width) return false;
    if (rect.bottom < playArea.top || rect.top > playArea.bottom) return false;
    if (element.closest('[hidden], [aria-hidden="true"]')) return false;

    const style = window.getComputedStyle(element);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
    if (Number(style.opacity) === 0) return false;

    return true;
  }
}
