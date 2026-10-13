import { useEffect, useRef, type ReactNode } from 'react';
import { IconClose } from './Icons';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  closeLabel?: string;
  hideClose?: boolean;
  /** Si es false, tocar fuera o pulsar Escape no cierra el diálogo. */
  dismissable?: boolean;
}

export function Modal({ open, title, onClose, children, wide, closeLabel = 'Cerrar', hideClose, dismissable = true }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`modal${wide ? ' wide' : ''}`}
      aria-labelledby="modal-title"
      onCancel={(e) => {
        e.preventDefault();
        if (dismissable) onClose();
      }}
      onClick={(e) => {
        if (dismissable && e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="sheet">
          <div className="sheet-head">
            <h2 id="modal-title">{title}</h2>
            {!hideClose && (
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                <IconClose />
                <span className="btn-label">{closeLabel}</span>
              </button>
            )}
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}

export function Confirm({
  open,
  title,
  message,
  yes,
  no,
  onYes,
  onNo,
}: {
  open: boolean;
  title: string;
  message: string;
  yes: string;
  no: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Modal open={open} title={title} onClose={onNo} hideClose>
      <p className="body">{message}</p>
      <div className="sheet-actions">
        <button type="button" className="btn btn-lg" onClick={onNo} data-autofocus>
          {no}
        </button>
        <button type="button" className="btn btn-lg btn-primary" onClick={onYes}>
          {yes}
        </button>
      </div>
    </Modal>
  );
}
