import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
) {
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Save current active element to restore later
    if (document.activeElement instanceof HTMLElement) {
      previousFocusedElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Focus the first focusable element inside the container if nothing inside is currently focused
    const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
    if (
      focusableElements.length > 0 &&
      (!document.activeElement || !container.contains(document.activeElement))
    ) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentContainer = containerRef.current;
      if (!currentContainer) return;

      const currentFocusables = Array.from(
        currentContainer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

      if (currentFocusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = currentFocusables[0];
      const lastElement = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: if on first element or outside, cycle to last
        if (
          document.activeElement === firstElement ||
          !currentContainer.contains(document.activeElement)
        ) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element or outside, cycle to first
        if (
          document.activeElement === lastElement ||
          !currentContainer.contains(document.activeElement)
        ) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previous element when modal closes
      if (previousFocusedElementRef.current && typeof previousFocusedElementRef.current.focus === 'function') {
        previousFocusedElementRef.current.focus();
      }
    };
  }, [isActive, containerRef]);
}
