import { useEffect, useId, useRef, useState } from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";

export function FeedbackSelect({ label, options, placeholder, value, onChange }) {
  const id = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const normalizedOptions = options.map((option) => typeof option === "string" ? { value: option } : option);
  const selectedIndex = normalizedOptions.findIndex((option) => option.value === value);
  const selectedOption = normalizedOptions[selectedIndex];
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  const show = () => {
    setActiveIndex(Math.max(0, selectedIndex));
    setOpen(true);
  };
  const choose = (option) => {
    onChange(option);
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };
  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      if (open) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(false);
      }
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (!open) {
        show();
        return;
      }
      setActiveIndex((index) => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return options.length - 1;
        const step = event.key === "ArrowDown" ? 1 : -1;
        return (index + step + normalizedOptions.length) % normalizedOptions.length;
      });
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open) choose(normalizedOptions[activeIndex].value);
      else show();
    }
  };

  return <div ref={rootRef} className={`feedback-select${open ? " is-open" : ""}${value ? " has-value" : ""}`}>
    <button
      ref={triggerRef}
      type="button"
      className="feedback-select-trigger"
      role="combobox"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={`${id}-options`}
      aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
      onClick={() => open ? setOpen(false) : show()}
      onKeyDown={handleKeyDown}
    >
      <span className="feedback-select-trigger-copy">
        {(selectedOption?.icon || selectedOption?.image) && <span className={`feedback-select-icon tone-${selectedOption.tone || "neutral"}`}>
          {selectedOption.image ? <img src={selectedOption.image} alt="" aria-hidden="true" /> : <selectedOption.icon size={15} stroke={1.8} aria-hidden="true" />}
        </span>}
        <span>{value || placeholder}</span>
      </span>
      <IconChevronDown size={17} stroke={1.7} aria-hidden="true" />
    </button>
    {open && <div id={`${id}-options`} className="feedback-select-options" role="listbox" aria-label={label}>
      {normalizedOptions.map((option, index) => <div
        key={option.value}
        id={`${id}-option-${index}`}
        className={`feedback-select-option tone-${option.tone || "neutral"}${index === activeIndex ? " is-highlighted" : ""}`}
        role="option"
        aria-selected={option.value === value}
        onPointerMove={() => setActiveIndex(index)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => choose(option.value)}
      >
        <span className="feedback-select-option-copy">
          {(option.icon || option.image) && <span className={`feedback-select-icon tone-${option.tone || "neutral"}`}>
            {option.image ? <img src={option.image} alt="" aria-hidden="true" /> : <option.icon size={15} stroke={1.8} aria-hidden="true" />}
          </span>}
          <span>{option.value}</span>
        </span>
        {option.value === value && <IconCheck className="feedback-select-check" size={15} stroke={2} aria-hidden="true" />}
      </div>)}
    </div>}
  </div>;
}
