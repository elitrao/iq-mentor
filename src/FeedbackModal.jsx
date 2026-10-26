import { useEffect, useRef } from 'react';
import { IconBulbFilled, IconX } from '@tabler/icons-react';
import { FeedbackPage } from './FeedbackPage.jsx';
import './feedback-modal.css';

export function FeedbackModal({ close, customer }) {
  const ref = useRef(null);
  const outsideStart = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    dialog.querySelector('.feedback-field input')?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const isOutside = (event) => {
    if (event.target !== ref.current) return false;
    const bounds = ref.current.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  const containFocus = (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...ref.current.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex="0"]')]
      .filter((element) => element.tabIndex >= 0 && !element.closest('[inert], [aria-hidden="true"]') && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && (document.activeElement === first || !ref.current.contains(document.activeElement))) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || !ref.current.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
  };

  return <dialog ref={ref} className="feedback-modal" aria-labelledby="feedback-modal-title"
    onKeyDown={containFocus}
    onCancel={(event) => { event.preventDefault(); close(); }}
    onPointerDown={(event) => { outsideStart.current = event.button === 0 && isOutside(event); }}
    onPointerCancel={() => { outsideStart.current = false; }}
    onClick={(event) => { if (outsideStart.current && isOutside(event)) close(); outsideStart.current = false; }}>
    <header className="feedback-modal-header">
      <h2 id="feedback-modal-title"><IconBulbFilled size={18} aria-hidden="true" />Предложить идею</h2>
      <button type="button" aria-label="Закрыть предложение идеи" onClick={close}><IconX size={20} stroke={1.7} /></button>
    </header>
    <div className="feedback-modal-scroll"><FeedbackPage customer={customer} /></div>
  </dialog>;
}
