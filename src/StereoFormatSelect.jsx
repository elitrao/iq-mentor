import { useEffect, useId, useRef, useState } from 'react';
import { IconChevronDown } from '@tabler/icons-react';
import { STEREO_FORMATS } from './settings/stereo.js';

export function StereoFormatSelect({ value, onChange, labelledBy, describedBy }) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const selected = Math.max(0, STEREO_FORMATS.findIndex((option) => option.value === value));
  const [active, setActive] = useState(selected);
  const show = () => { setActive(selected); setOpen(true); };
  const choose = (index) => {
    onChange(STEREO_FORMATS[index].value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, [open]);

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      if (open) { event.preventDefault(); event.stopPropagation(); setOpen(false); }
    } else if (event.key === 'Tab') {
      setOpen(false);
    } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      if (!open) { show(); return; }
      setActive((index) => event.key === 'Home' ? 0 : event.key === 'End' ? STEREO_FORMATS.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + STEREO_FORMATS.length) % STEREO_FORMATS.length);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (open) choose(active); else show();
    }
  };

  return <div ref={rootRef} className={`stereo-format-select${open ? ' is-open' : ''}`}
    onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={triggerRef} type="button" className="stereo-format-trigger" role="combobox"
      aria-labelledby={labelledBy} aria-describedby={describedBy} aria-haspopup="listbox"
      aria-expanded={open} aria-controls={`${id}-options`}
      aria-activedescendant={open ? `${id}-option-${active}` : undefined}
      onKeyDown={onKeyDown} onClick={() => open ? setOpen(false) : show()}>
      <span>{STEREO_FORMATS[selected].label}</span>
      <IconChevronDown size={18} stroke={1.5} aria-hidden="true" />
    </button>
    <div id={`${id}-options`} className="stereo-format-options" role="listbox" aria-labelledby={labelledBy}
      aria-hidden={!open} inert={!open}>
      {STEREO_FORMATS.map((option, index) => <div key={option.value} id={`${id}-option-${index}`}
        role="option" aria-selected={value === option.value}
        className={`stereo-format-option${index === active ? ' is-highlighted' : ''}`}
        onPointerMove={() => setActive(index)} onMouseDown={(event) => event.preventDefault()}
        onClick={() => choose(index)}>{option.label}</div>)}
    </div>
  </div>;
}
