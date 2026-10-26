// Motion helpers for script-driven animation (docs/design/visual-language.md, section 7).
// Durations and the curve come from the CSS tokens in app/tokens.css, so a script never
// carries its own numbers, and both switches (prefers-reduced-motion, data-motion="off")
// apply to it exactly as to CSS.

export type MotionToken = '--dur-1' | '--dur-2' | '--dur-3' | '--dur-draw' | '--dur-dot' | '--dur-step';

export function motionEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.dataset.motion !== 'off' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Duration of a motion token in milliseconds; 0 when motion is off. */
export function motionDuration(name: MotionToken): number {
  if (!motionEnabled()) return 0;
  const value = token(name), number = parseFloat(value);
  if (!Number.isFinite(number)) return 0;
  return value.endsWith('ms') ? number : value.endsWith('s') ? number * 1000 : 0;
}

/** Technique 1, "appear": opacity and the --shift-appear offset, on the shared curve. */
export function appear(element: Element | null | undefined, name: MotionToken = '--dur-2'): Animation | undefined {
  const duration = motionDuration(name);
  if (!element || !duration) return undefined;
  return element.animate(
    [{ opacity: 0, transform: `translateY(${token('--shift-appear') || '0px'})` }, { opacity: 1, transform: 'none' }],
    { duration, easing: token('--ease') || undefined },
  );
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => Promise<void>) => unknown };

/**
 * Page transition: runs `navigate` inside a View Transition when the browser supports it and
 * motion is on; otherwise navigates instantly. The transition waits for `committed` (resolved
 * when the new page renders) for at most one long duration, so a slow route never freezes
 * the old page behind the transition.
 */
export function transitionTo(navigate: () => void, committed: Promise<void>): boolean {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || !motionEnabled()) return false;
  const limit = motionDuration('--dur-3');
  const transition = doc.startViewTransition(() => {
    navigate();
    return Promise.race([committed, new Promise<void>(resolve => setTimeout(resolve, limit))]);
  }) as { ready?: Promise<unknown>; finished?: Promise<unknown> } | undefined;
  // A skipped transition (hidden tab, a second navigation) rejects `ready`; the page still updates.
  transition?.ready?.catch(() => {});
  transition?.finished?.catch(() => {});
  return true;
}
