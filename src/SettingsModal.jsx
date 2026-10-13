import { useEffect, useRef } from 'react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { SettingsWorkspace } from './SettingsWorkspace.jsx';
import './settings-modal.css';

export function SettingsModal({ close, toast, ...workspaceProps }) {
  const ref = useRef(null);
  const outsideStart = useRef(false);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const isOutside = (event) => {
    if (event.target !== event.currentTarget) return false;
    const bounds = ref.current.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };
  const containKeyboardFocus = (event) => {
    const dialog = ref.current;
    if (event.key !== 'Tab' || event.target.closest('dialog') !== dialog) return;
    const scope = dialog.querySelector('.modal-backdrop .modal-card') || dialog;
    const focusable = Array.from(scope.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => !element.hidden && element.getClientRects().length && getComputedStyle(element).visibility !== 'hidden');
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <dialog ref={ref} className="settings-modal" aria-labelledby="settings-modal-title"
    onKeyDown={containKeyboardFocus}
    onCancel={(event) => {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      // Preserve an existing custom child modal instead of dismissing all Settings.
      if (!ref.current.querySelector('.modal-backdrop')) close();
    }}
    onPointerDown={(event) => { outsideStart.current = isOutside(event); }}
    onClick={(event) => { if (outsideStart.current && isOutside(event)) close(); outsideStart.current = false; }}>
    <button type="button" className="settings-modal-close" aria-label="Закрыть настройки" onClick={close}><IconX size={20} stroke={1.7} /></button>
    <SettingsWorkspace {...workspaceProps} modal />
    {toast && <div className="settings-modal-toast" role="status"><IconCheck size={16} />{toast}</div>}
  </dialog>;
}
