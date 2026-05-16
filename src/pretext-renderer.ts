import {
  layout,
  layoutWithLines,
  prepare,
  prepareWithSegments,
  layoutNextLine,
  walkLineRanges,
  type PreparedText,
  type PreparedTextWithSegments,
  type LayoutCursor,
} from '@chenglou/pretext';

export type { PreparedTextWithSegments, LayoutCursor };

const UNBOUNDED_WIDTH = 100_000;

export type WhiteSpaceMode = 'normal' | 'pre-wrap';

export interface TextBlock {
  text: string;
  font: string;
  lineHeight: number;
  maxWidth: number;
  lineCount: number;
  width: number;
  height: number;
  prepared: PreparedTextWithSegments;
  lines: Array<{ text: string; width: number }>;
}

export interface DrawOptions {
  alpha?: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
  shadowBlur?: number;
  shadowColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export class PretextRenderer {
  private readonly preparedCache = new Map<string, PreparedText>();
  private readonly preparedSegmentCache = new Map<string, PreparedTextWithSegments>();
  private readonly blockCache = new Map<string, TextBlock>();
  private readonly heightCache = new Map<string, number>();

  measureParagraphHeight(
    text: string,
    font: string,
    lineHeight: number,
    maxWidth: number,
    whiteSpace: WhiteSpaceMode = 'normal',
  ): number {
    const key = `h::${font}::${lineHeight}::${maxWidth}::${whiteSpace}::${text}`;
    const cached = this.heightCache.get(key);
    if (cached !== undefined) return cached;

    const prepared = this.getPrepared(text, font, whiteSpace);
    const measured = layout(prepared, maxWidth, lineHeight).height;
    this.heightCache.set(key, measured);
    return measured;
  }

  measureMaxLineWidth(
    text: string,
    font: string,
    maxWidth = UNBOUNDED_WIDTH,
    whiteSpace: WhiteSpaceMode = 'pre-wrap',
  ): number {
    const prepared = this.getPreparedSegments(text, font, whiteSpace);
    let maxLineWidth = 0;
    walkLineRanges(prepared, maxWidth, (line) => {
      if (line.width > maxLineWidth) maxLineWidth = line.width;
    });
    return maxLineWidth;
  }

  getBlock(
    text: string,
    font: string,
    lineHeight: number,
    maxWidth = UNBOUNDED_WIDTH,
    whiteSpace: WhiteSpaceMode = 'pre-wrap',
  ): TextBlock {
    const key = `b::${font}::${lineHeight}::${maxWidth}::${whiteSpace}::${text}`;
    const cached = this.blockCache.get(key);
    if (cached !== undefined) return cached;

    const prepared = this.getPreparedSegments(text, font, whiteSpace);
    const laidOut = layoutWithLines(prepared, maxWidth, lineHeight);
    const width = laidOut.lines.reduce(
      (largest, line) => Math.max(largest, line.width),
      0,
    );
    const block: TextBlock = {
      text,
      font,
      lineHeight,
      maxWidth,
      lineCount: laidOut.lineCount,
      width,
      height: laidOut.height,
      prepared,
      lines: laidOut.lines.map((line) => ({
        text: line.text,
        width: line.width,
      })),
    };

    this.blockCache.set(key, block);
    return block;
  }

  drawBlock(
    ctx: CanvasRenderingContext2D,
    block: TextBlock,
    x: number,
    y: number,
    options: DrawOptions = {},
  ): void {
    const align = options.align ?? 'left';
    const verticalAlign = options.verticalAlign ?? 'top';
    const originY =
      verticalAlign === 'middle'
        ? y - block.height / 2
        : verticalAlign === 'bottom'
          ? y - block.height
          : y;

    ctx.save();
    ctx.font = block.font;
    ctx.textBaseline = 'top';
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.fillStyle = options.color ?? '#f6f2df';
    ctx.shadowColor = options.shadowColor ?? 'transparent';
    ctx.shadowBlur = options.shadowBlur ?? 0;
    if (options.strokeColor !== undefined) {
      ctx.strokeStyle = options.strokeColor;
      ctx.lineWidth = options.strokeWidth ?? 1;
      ctx.lineJoin = 'round';
    }

    for (let i = 0; i < block.lines.length; i++) {
      const line = block.lines[i]!;
      const drawX =
        align === 'center'
          ? x - line.width / 2
          : align === 'right'
            ? x - line.width
            : x;
      const drawY = originY + i * block.lineHeight;
      if (options.strokeColor !== undefined) ctx.strokeText(line.text, drawX, drawY);
      ctx.fillText(line.text, drawX, drawY);
    }

    ctx.restore();
  }

  prepareSegments(text: string, font: string, whiteSpace: WhiteSpaceMode = 'normal'): PreparedTextWithSegments {
    return this.getPreparedSegments(text, font, whiteSpace);
  }

  clear(): void {
    this.preparedCache.clear();
    this.preparedSegmentCache.clear();
    this.blockCache.clear();
    this.heightCache.clear();
  }

  private getPrepared(text: string, font: string, whiteSpace: WhiteSpaceMode): PreparedText {
    const key = `p::${font}::${whiteSpace}::${text}`;
    const cached = this.preparedCache.get(key);
    if (cached !== undefined) return cached;

    const prepared = prepare(text, font, { whiteSpace });
    this.preparedCache.set(key, prepared);
    return prepared;
  }

  private getPreparedSegments(
    text: string,
    font: string,
    whiteSpace: WhiteSpaceMode,
  ): PreparedTextWithSegments {
    const key = `s::${font}::${whiteSpace}::${text}`;
    const cached = this.preparedSegmentCache.get(key);
    if (cached !== undefined) return cached;

    const prepared = prepareWithSegments(text, font, { whiteSpace });
    this.preparedSegmentCache.set(key, prepared);
    return prepared;
  }
}

export { layoutNextLine };
