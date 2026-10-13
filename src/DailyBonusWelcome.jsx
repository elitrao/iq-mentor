import { useEffect, useRef } from 'react';
import { IconX } from '@tabler/icons-react';
import dailyBonusGlow from './assets/welcome/daily-bonus-glow.png';
import './daily-bonus-welcome.css';

const SEEN_KEY = 'iq-mentor-daily-bonus-welcome-v1';
// Temporary review mode requested by the product owner: replay on every reload.
const SHOW_ON_EVERY_RELOAD = true;

// Frontend welcome state only. Bonus accrual belongs to the billing service.
export function shouldShowDailyBonusWelcome() {
  if (SHOW_ON_EVERY_RELOAD) return true;
  if (new URLSearchParams(window.location.search).get('welcome') === 'bonus') return true;
  try { return localStorage.getItem(SEEN_KEY) !== 'seen'; }
  catch { return true; }
}

export function acknowledgeDailyBonusWelcome() {
  try { localStorage.setItem(SEEN_KEY, 'seen'); }
  catch { /* The welcome remains usable when browser storage is unavailable. */ }
  const url = new URL(window.location.href);
  if (url.searchParams.get('welcome') === 'bonus') {
    url.searchParams.delete('welcome');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}

export function DailyBonusWelcome({ onClose, onStart }) {
  const dialogRef = useRef(null);
  const titleRef = useRef(null);
  const startRef = useRef(null);
  const pointerStartedOutside = useRef(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    titleRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  const isOutside = (event) => {
    if (event.target !== event.currentTarget) return false;
    const bounds = dialogRef.current.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
  };

  const containFocus = (event) => {
    if (event.key !== 'Tab') return;
    const first = dialogRef.current.querySelector('button');
    const last = startRef.current;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return <dialog ref={dialogRef} className="daily-bonus-welcome" aria-labelledby="daily-bonus-title" aria-describedby="daily-bonus-description"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onKeyDown={containFocus}
    onPointerDown={(event) => { pointerStartedOutside.current = isOutside(event); }}
    onClick={(event) => {
      if (pointerStartedOutside.current && isOutside(event)) onClose();
      pointerStartedOutside.current = false;
    }}>
    <div className="daily-bonus-art" aria-hidden="true"><img className="daily-bonus-glow" src={dailyBonusGlow} alt="" /></div>
    <button className="daily-bonus-close" type="button" onClick={onClose} aria-label="Закрыть приветствие"><IconX size={20} stroke={1.6} /></button>
    <div className="daily-bonus-content">
      <h1 ref={titleRef} id="daily-bonus-title" tabIndex={-1}><span className="daily-bonus-amount">250<span className="daily-bonus-currency">₽</span></span><span className="daily-bonus-heading">бонусами каждый день</span></h1>
      <p className="daily-bonus-intro">Ваш первый шаг — за наш счёт.</p>
      <p id="daily-bonus-description">Анализируйте звонки и тренируйте команду вместе с нашим сервисом. Бонусный лимит обновляется ежедневно до первого пополнения баланса.</p>
      <button ref={startRef} className="daily-bonus-start" type="button" onClick={onStart}>Начать знакомство</button>
    </div>
  </dialog>;
}
