import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocumentBrickSetOptions, DocumentBrickSource } from './document-bricks';
import type { PretextBreakerGameOptions } from './game';
import { usePretextBreakerTrigger, type PretextBreakerTriggerOptions } from './useTrigger';

export const defaultFontStylesheetHref =
  'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600;700;800&display=swap';

export interface PretextBreakerFontOptions {
  stylesheetHref?: string | false;
  waitForFonts?: boolean;
  loadingDelayMs?: number;
}

export interface PretextBreakerLabels {
  loading?: string;
  exit?: string;
  canvas?: string;
}

export interface PretextBreakerProps {
  trigger?: PretextBreakerTriggerOptions;
  game?: PretextBreakerGameOptions;
  documentBricks?: DocumentBrickSetOptions;
  brickSources?: readonly DocumentBrickSource[];
  font?: PretextBreakerFontOptions;
  labels?: PretextBreakerLabels;
  className?: string;
  bodyScrollLock?: boolean;
}

function classNames(...names: Array<string | undefined>): string {
  return names.filter(Boolean).join(' ');
}

export function PretextBreaker({
  trigger,
  game,
  documentBricks,
  brickSources,
  font,
  labels,
  className,
  bodyScrollLock = true,
}: PretextBreakerProps) {
  const { active, deactivate } = usePretextBreakerTrigger(trigger);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<import('./game').PretextBreakerGame | null>(null);
  const [loading, setLoading] = useState(false);

  const fontOptions = useMemo(() => ({
    stylesheetHref: font?.stylesheetHref === undefined
      ? defaultFontStylesheetHref
      : font.stylesheetHref,
    waitForFonts: font?.waitForFonts ?? true,
    loadingDelayMs: font?.loadingDelayMs ?? 200,
  }), [font]);

  const gameOptions = useMemo<PretextBreakerGameOptions>(() => {
    const inheritedDocumentBricks = game?.documentBricks ?? {};
    const mergedDocumentBricks: DocumentBrickSetOptions = {
      ...inheritedDocumentBricks,
      ...documentBricks,
      sources: brickSources ?? documentBricks?.sources ?? inheritedDocumentBricks.sources,
    };

    return {
      ...game,
      documentBricks: mergedDocumentBricks,
    };
  }, [brickSources, documentBricks, game]);

  const handleQuit = useCallback(() => {
    if (gameRef.current) {
      gameRef.current.destroy();
      gameRef.current = null;
    }
    deactivate();
  }, [deactivate]);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      return;
    }

    const shouldWait = fontOptions.waitForFonts || Boolean(fontOptions.stylesheetHref);
    setLoading(shouldWait);

    const stylesheetHref = fontOptions.stylesheetHref;
    const fontLink = typeof stylesheetHref === 'string' && stylesheetHref.length > 0
      ? document.createElement('link')
      : null;
    if (fontLink) {
      fontLink.rel = 'stylesheet';
      fontLink.href = stylesheetHref || '';
      document.head.appendChild(fontLink);
    }

    let cancelled = false;

    const loadFont = async () => {
      if (fontOptions.loadingDelayMs > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, fontOptions.loadingDelayMs));
      }
      if (fontOptions.waitForFonts && 'fonts' in document) {
        await document.fonts.ready;
      }
      if (!cancelled) setLoading(false);
    };

    if (shouldWait) {
      void loadFont();
    }

    const prevOverflow = document.body.style.overflow;
    if (bodyScrollLock) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      cancelled = true;
      if (bodyScrollLock) {
        document.body.style.overflow = prevOverflow;
      }
      if (fontLink?.parentNode) {
        fontLink.parentNode.removeChild(fontLink);
      }
    };
  }, [active, bodyScrollLock, fontOptions]);

  useEffect(() => {
    if (!active || loading) return;
    if (!canvasRef.current) return;

    let cancelled = false;

    const startGame = async () => {
      const { PretextBreakerGame } = await import('./game');
      if (cancelled || !canvasRef.current) return;

      const gameInstance = new PretextBreakerGame(canvasRef.current, gameOptions);
      gameInstance.setOnQuit(handleQuit);
      gameRef.current = gameInstance;
    };

    void startGame();

    return () => {
      cancelled = true;
      if (gameRef.current) {
        gameRef.current.destroy();
        gameRef.current = null;
      }
    };
  }, [active, gameOptions, handleQuit, loading]);

  if (!active) return null;

  return (
    <div className={classNames('pretext-breaker__overlay', className)}>
      {loading && (
        <div className="pretext-breaker__loading">
          {labels?.loading ?? 'LOADING PRETEXT ENGINE...'}
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="pretext-breaker__canvas"
        aria-label={labels?.canvas ?? 'Pretext Breaker - text-rendered block breaker game'}
      />
      <button className="pretext-breaker__exit-button" onClick={handleQuit} type="button">
        {labels?.exit ?? '[ESC] EXIT'}
      </button>
    </div>
  );
}

export { PretextBreaker as EasterEgg };
export default PretextBreaker;

export {
  DocumentBrickSet,
  DOCUMENT_BRICK_COLORS,
  contentBrickSelector,
  defaultBrickSources,
  genericBrickSources,
  navigationBrickSelector,
} from './document-bricks';
export type {
  DocumentBrick,
  DocumentBrickPlayArea,
  DocumentBrickSetOptions,
  DocumentBrickSource,
} from './document-bricks';
export { DEFAULT_FONT_FAMILY, PretextBreakerGame } from './game';
export type { PretextBreakerGameLabels, PretextBreakerGameOptions } from './game';
export { layoutNextLine, PretextRenderer } from './pretext-renderer';
export type {
  DrawOptions,
  LayoutCursor,
  PreparedTextWithSegments,
  TextBlock,
  WhiteSpaceMode,
} from './pretext-renderer';
export { KONAMI_CODE, usePretextBreakerTrigger, useTrigger } from './useTrigger';
export type { PretextBreakerTriggerOptions, PretextBreakerTriggerState } from './useTrigger';
