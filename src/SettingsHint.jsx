import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { IconInfoCircle } from '@tabler/icons-react';
import './settings-hint.css';

export function SettingsHint({ label, children }) {
  const id = useId();
  const trigger = useRef(null);
  const bubble = useRef(null);
  const pinned = useRef(false);
  const closeTimer = useRef(null);
  const [open, setOpen] = useState(false);
  const reveal = () => { clearTimeout(closeTimer.current); setOpen(true); };
  const dismiss = () => { clearTimeout(closeTimer.current); pinned.current = false; setOpen(false); };
  const leave = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      if (!pinned.current && document.activeElement !== trigger.current) setOpen(false);
    }, 120);
  };

  useLayoutEffect(() => {
    const tooltip = bubble.current;
    if (!open) { if (tooltip.matches(':popover-open')) tooltip.hidePopover(); return; }
    tooltip.showPopover();
    const position = () => {
      const anchor = trigger.current.getBoundingClientRect();
      const bounds = tooltip.getBoundingClientRect();
      const left = Math.max(16, Math.min(anchor.left, window.innerWidth - bounds.width - 16));
      const below = anchor.bottom + 8;
      const top = below + bounds.height <= window.innerHeight - 16 ? below : Math.max(16, anchor.top - bounds.height - 8);
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
      if (tooltip.matches(':popover-open')) tooltip.hidePopover();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event) => {
      if (!trigger.current.contains(event.target) && !bubble.current.contains(event.target)) dismiss();
    };
    const escape = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      dismiss();
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('keydown', escape, true);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('keydown', escape, true);
    };
  }, [open]);
  useEffect(() => () => clearTimeout(closeTimer.current), []);

  return <div className="settings-hint">
    <button ref={trigger} type="button" className="settings-hint-trigger" aria-label={`О настройке «${label}»`} aria-describedby={id} aria-expanded={open}
      onPointerEnter={reveal} onPointerLeave={leave} onFocus={reveal} onBlur={dismiss}
      onClick={() => { clearTimeout(closeTimer.current); pinned.current = !pinned.current; setOpen(pinned.current); }}>
      <IconInfoCircle size={16} stroke={1.7} aria-hidden="true" />
    </button>
    <div ref={bubble} id={id} popover="manual" role="tooltip" className="settings-hint-bubble" onPointerEnter={reveal} onPointerLeave={leave}>{children}</div>
  </div>;
}
