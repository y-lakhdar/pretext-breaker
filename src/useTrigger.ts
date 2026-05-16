import { useCallback, useEffect, useState } from 'react';

export const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA',
] as const;

export interface PretextBreakerTriggerOptions {
  enabled?: boolean;
  queryParam?: string | false;
  queryValue?: string;
  sequence?: readonly string[] | false;
  initialActive?: boolean;
}

export interface PretextBreakerTriggerState {
  active: boolean;
  activate: () => void;
  deactivate: () => void;
}

export function usePretextBreakerTrigger(
  options: PretextBreakerTriggerOptions = {},
): PretextBreakerTriggerState {
  const enabled = options.enabled ?? true;
  const queryParam = options.queryParam === undefined ? 'game' : options.queryParam;
  const queryValue = options.queryValue ?? 'true';
  const sequence = options.sequence === undefined ? KONAMI_CODE : options.sequence;
  const [active, setActive] = useState(options.initialActive ?? false);

  useEffect(() => {
    if (!enabled || queryParam === false) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get(queryParam) === queryValue) {
      setActive(true);
    }
  }, [enabled, queryParam, queryValue]);

  useEffect(() => {
    if (!enabled || active || sequence === false || sequence.length === 0) return;

    const activeSequence = sequence;

    let buffer: string[] = [];

    function handleKeyDown(event: KeyboardEvent) {
      buffer.push(event.code);
      if (buffer.length > activeSequence.length) {
        buffer = buffer.slice(-activeSequence.length);
      }
      if (
        buffer.length === activeSequence.length &&
        buffer.every((key, index) => key === activeSequence[index])
      ) {
        setActive(true);
        buffer = [];
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, enabled, sequence]);

  const activate = useCallback(() => setActive(true), []);
  const deactivate = useCallback(() => setActive(false), []);

  return { active, activate, deactivate };
}

export function useTrigger(options?: PretextBreakerTriggerOptions): PretextBreakerTriggerState {
  return usePretextBreakerTrigger(options);
}
