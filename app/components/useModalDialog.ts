"use client";

import { type RefObject, useEffect } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type ModalDialogOptions = {
  open: boolean;
  onClose: () => void;
  dialogRef: RefObject<HTMLElement | null>;
  triggerRef: RefObject<HTMLElement | null>;
  lockScroll?: boolean;
};

export function useModalDialog({
  dialogRef,
  lockScroll = true,
  onClose,
  open,
  triggerRef,
}: ModalDialogOptions) {
  useEffect(() => {
    if (!open) return;

    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    const previousOverflow = document.body.style.overflow;
    const initialFocus = dialog?.querySelector<HTMLElement>("[data-dialog-initial-focus]")
      ?? dialog?.querySelector<HTMLElement>(focusableSelector)
      ?? dialog;

    if (lockScroll) document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => initialFocus?.focus({ preventScroll: true }));

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector))
        .filter((element) => !element.hasAttribute("inert") && element.offsetParent !== null);
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
      if (lockScroll) document.body.style.overflow = previousOverflow;
      window.requestAnimationFrame(() => trigger?.focus({ preventScroll: true }));
    };
  }, [dialogRef, lockScroll, onClose, open, triggerRef]);
}
