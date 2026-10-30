// Motion helpers for script-driven animation (docs/design/visual-language.md, section 7).
// Durations and the curve come from the CSS tokens in app/tokens.css, so a script never
// carries its own numbers, and both switches (prefers-reduced-motion, data-motion="off")
// apply to it exactly as to CSS.

export type MotionToken = '--dur-1' | '--dur-2' | '--dur-3' | '--dur-draw' | '--dur-dot' | '--dur-step' | '--dur-exit' | '--dur-enter' | '--dur-stagger';

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

/** Technique 1, "appear": opacity and the --shift-appear offset, decelerating on the enter curve (--ease-enter). */
export function appear(element: Element | null | undefined, name: MotionToken = '--dur-2'): Animation | undefined {
  const duration = motionDuration(name);
  if (!element || !duration) return undefined;
  return element.animate(
    [{ opacity: 0, transform: `translateY(${token('--shift-appear') || '0px'})` }, { opacity: 1, transform: 'none' }],
    { duration, easing: token('--ease-enter') || token('--ease') || undefined },
  );
}

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => Promise<void>) => unknown };

/**
 * Page transition: always runs `navigate`; inside a View Transition when the browser supports it
 * and motion is on, otherwise directly. `navigate` may return a promise that settles when the new
 * page renders: the transition waits for it at most one long duration, so a slow route never
 * freezes the old page behind the transition; a page that is late is shown without the fade.
 * Returns whether a transition started.
 */
export function transitionTo(navigate: () => Promise<void> | void): boolean {
  const doc = document as ViewTransitionDocument;
  if (!doc.startViewTransition || !motionEnabled()) {
    void navigate();
    return false;
  }
  const limit = motionDuration('--dur-3');
  type Transition = { ready?: Promise<unknown>; finished?: Promise<unknown>; skipTransition?: () => void };
  const transition = doc.startViewTransition(async () => {
    const late = await Promise.race([
      Promise.resolve(navigate()).then(() => false),
      new Promise<boolean>(resolve => setTimeout(() => resolve(true), limit)),
    ]);
    // The new page is not there yet: skip the fade instead of fading the old page back in.
    if (late) transition?.skipTransition?.();
  }) as Transition | undefined;
  // A skipped transition (hidden tab, a second navigation) rejects `ready`; the page still updates.
  transition?.ready?.catch(() => {});
  transition?.finished?.catch(() => {});
  return true;
}
