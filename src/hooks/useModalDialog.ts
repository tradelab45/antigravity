import { useEffect, useRef } from 'react';

/**
 * Everything a modal overlay needs to behave like a dialog.
 *
 * Most of the overlays in this app were built as a fixed div with a backdrop
 * and nothing else: no role, no label, no focus handling. A screen reader
 * announced nothing when one opened, Tab walked straight out of the dialog
 * into the page behind it, and on several of them Escape did nothing at all.
 *
 * Spread `dialogProps` on the overlay element and give it `ref`.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

interface ModalDialogOptions {
  onClose: () => void;
  /**
   * These modals stay mounted and return null while closed, so the hook has
   * to be called on every render and do nothing until the dialog is actually
   * on screen.
   */
  open?: boolean;
  /** The id of the heading that names this dialog, when it has one. */
  labelledBy?: string;
  /** A name for dialogs with no visible heading to point at. */
  label?: string;
  /**
   * Leave this off for a dialog that already binds Escape itself, so the key
   * is not handled twice.
   */
  closeOnEscape?: boolean;
  /**
   * Leave this off for a dialog that puts focus somewhere specific itself,
   * such as a search field, rather than on its first focusable element.
   */
  autoFocus?: boolean;
}

export function useModalDialog({
  onClose,
  open = true,
  labelledBy,
  label,
  closeOnEscape = true,
  autoFocus = true,
}: ModalDialogOptions) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // Stop the key here so a dialog opened on top of another one closes
      // only itself.
      event.stopPropagation();
      onClose();
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open, closeOnEscape, onClose]);

  // The page behind a modal must not scroll with it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus moves into the dialog on open and returns to whatever opened it.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    if (node && autoFocus) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? node).focus({ preventScroll: true });
    }
    return () => {
      // The opener can be gone by now — a row that re-rendered, say.
      if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    };
  }, [open, autoFocus]);

  // Tab cycles within the dialog rather than walking out of it.
  useEffect(() => {
    if (!open) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const node = ref.current;
      if (!node) return;

      const focusable = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => element.offsetParent !== null || element === document.activeElement,
      );
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (!node.contains(active)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  return {
    ref,
    dialogProps: {
      role: 'dialog' as const,
      'aria-modal': true,
      // The overlay itself takes focus when it holds nothing focusable.
      tabIndex: -1,
      ...(labelledBy ? { 'aria-labelledby': labelledBy } : {}),
      ...(label ? { 'aria-label': label } : {}),
    },
  };
}
