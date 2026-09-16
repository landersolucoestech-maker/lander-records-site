"use client";

import { useEffect, useRef } from "react";
import { AdminIcon } from "./AdminIcon";

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]';

type AdminDialogProps = {
  children: React.ReactNode;
  description?: string;
  footer?: React.ReactNode;
  onClose: () => void;
  title: string;
};

export function AdminDialog({ children, description, footer, onClose, title }: AdminDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => element.getClientRects().length);
    (focusables()[0] || dialog).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const targets = focusables();
      const first = targets[0];
      const last = targets.at(-1);
      if (!first || !last) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      openerRef.current?.focus();
    };
  }, [onClose]);

  return <div className="adminDialogBackdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }} role="presentation">
    <section aria-labelledby="admin-dialog-title" aria-modal="true" className="adminDialog" ref={dialogRef} role="dialog" tabIndex={-1}>
      <header><div><h2 id="admin-dialog-title">{title}</h2>{description ? <p>{description}</p> : null}</div><button aria-label="Fechar" className="adminIconButton" onClick={onClose} type="button"><AdminIcon name="x" size={17} /></button></header>
      <div className="adminDialogBody">{children}</div>
      {footer ? <footer>{footer}</footer> : null}
    </section>
  </div>;
}
