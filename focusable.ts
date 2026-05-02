export interface FocusableOptions {
  readonly active?: HTMLElement | null;
  readonly wrap?: boolean;
}

const FOCUSABLE_SELECTOR =
  ':is(a[href], area[href], button, embed, iframe, input:not([type="hidden" i]), object, select, details > summary:first-of-type, textarea, [contenteditable]:not([contenteditable="false" i]), [controls], [tabindex]):not(:disabled, [hidden], [inert], [tabindex="-1"])';

export function getFocusables(container: HTMLElement = document.body): HTMLElement[] {
  if (!container) {
    return [];
  }

  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(isFocusable);
}

export function getNextFocusable(
  container: HTMLElement = document.body,
  options: FocusableOptions = {},
): HTMLElement | null {
  if (!container) {
    return null;
  }

  return getRelativeFocusable(container, 1, options);
}

export function getPreviousFocusable(
  container: HTMLElement = document.body,
  options: FocusableOptions = {},
): HTMLElement | null {
  if (!container) {
    return null;
  }

  return getRelativeFocusable(container, -1, options);
}

export function hasFocusable(container: HTMLElement = document.body): boolean {
  if (!container) {
    return false;
  }

  return getFocusables(container).length > 0;
}

export function isFocusable(element: HTMLElement): boolean {
  if (!element) {
    return false;
  }

  return (
    element.matches(FOCUSABLE_SELECTOR) &&
    !isDisabledDeep(element) &&
    element.checkVisibility({ contentVisibilityAuto: true, opacityProperty: true, visibilityProperty: true })
  );
}

function containsDeep(container: Node, node: Node) {
  if (!container || !node) {
    return false;
  }

  for (
    let current: Node | null = node;
    current;
    current = !(current instanceof ShadowRoot) ? current.parentNode : current.mode === 'open' ? current.host : null
  ) {
    if (current === container) {
      return true;
    }
  }

  return false;
}

function getActiveElement() {
  let active = document.activeElement;

  while (active instanceof HTMLElement && active.shadowRoot?.activeElement) {
    active = active.shadowRoot.activeElement;
  }

  return active instanceof HTMLElement ? active : null;
}

function getRelativeFocusable(container: HTMLElement, offset: number = 0, options: FocusableOptions = {}) {
  if (!container) {
    return null;
  }

  const focusables = getFocusables(container);
  const { length } = focusables;

  if (length === 0) {
    return null;
  }

  const { active, wrap = false } = options;
  const current = active ?? getActiveElement();

  if (!current || !containsDeep(container, current)) {
    return null;
  }

  const currentIndex = focusables.indexOf(current);

  if (currentIndex === -1) {
    return null;
  }

  const offsetIndex = currentIndex + offset;

  if ((offsetIndex < 0 || offsetIndex >= length) && !wrap) {
    return null;
  }

  return focusables[(offsetIndex + length) % length] ?? null;
}

function isDisabledDeep(element: Element) {
  if (!element) {
    return false;
  }

  const isFormControl = (element: Element) => {
    return /^(BUTTON|INPUT|SELECT|TEXTAREA)$/.test(element.tagName);
  };

  for (
    let current: Node | null = element;
    current;
    current = current instanceof ShadowRoot ? (current.mode === 'open' ? current.host : null) : current.parentNode
  ) {
    if (!(current instanceof Element)) {
      continue;
    }

    if (current === element && isFormControl(current) && current.hasAttribute('disabled')) {
      return true;
    }

    if (current.matches('[inert]')) {
      return true;
    }

    if (isFormControl(element) && current.tagName === 'FIELDSET' && current.hasAttribute('disabled')) {
      const firstLegend = current.querySelector(':scope > legend:first-of-type');

      if (firstLegend?.contains(element)) {
        continue;
      }

      return true;
    }
  }

  return false;
}
