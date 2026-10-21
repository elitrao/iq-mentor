import { useEffect, useRef } from 'react';
import { IconX } from '@tabler/icons-react';
import dailyBonusGlow from './assets/welcome/daily-bonus-glow.png';
import './daily-bonus-welcome.css';

const SEEN_KEY = 'iq-mentor-daily-bonus-welcome-v1';

// Frontend welcome state only. Bonus accrual belongs to the billing service.
export function shouldShowDailyBonusWelcome() {
  if (['bonus', 'exhausted'].includes(new URLSearchParams(window.location.search).get('welcome'))) return true;
  try { return localStorage.getItem(SEEN_KEY) !== 'seen'; }
  catch { return true; }
}

export function acknowledgeDailyBonusWelcome() {
  try { localStorage.setItem(SEEN_KEY, 'seen'); }
  catch { /* The welcome remains usable when browser storage is unavailable. */ }
  const url = new URL(window.location.href);
  if (['bonus', 'exhausted'].includes(url.searchParams.get('welcome'))) {
    url.searchParams.delete('welcome');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}

export function DailyBonusWelcome({ onClose, onStart, variant = 'welcome' }) {
  const exhausted = variant === 'exhausted';
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

  return <dialog ref={dialogRef} className={`daily-bonus-welcome${exhausted ? ' daily-bonus-exhausted' : ''}`} aria-labelledby="daily-bonus-title" aria-describedby="daily-bonus-description"
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onKeyDown={containFocus}
    onPointerDown={(event) => { pointerStartedOutside.current = isOutside(event); }}
    onClick={(event) => {
      if (pointerStartedOutside.current && isOutside(event)) onClose();
      pointerStartedOutside.current = false;
    }}>
    <div className="daily-bonus-art" aria-hidden="true"><img className="daily-bonus-glow" src={dailyBonusGlow} alt="" /></div>
    <button className="daily-bonus-close" type="button" onClick={onClose} aria-label={exhausted ? 'Закрыть уведомление о лимите' : 'Закрыть приветствие'}><IconX size={20} stroke={1.6} /></button>
    {exhausted ? <div className="daily-bonus-content daily-bonus-exhausted-content">
      <h1 ref={titleRef} id="daily-bonus-title" tabIndex={-1}>Пробный период<span className="daily-bonus-heading">закончился</span></h1>
      <p id="daily-bonus-description">Пополните баланс, чтобы продолжить<br />анализ звонков и тренировки.</p>
      <button ref={startRef} className="daily-bonus-start" type="button" onClick={onStart}>Пополнить баланс</button>
    </div> : <div className="daily-bonus-content">
      <h1 ref={titleRef} id="daily-bonus-title" tabIndex={-1}><span className="daily-bonus-amount">250{' '}<span className="daily-bonus-currency">₽</span></span><span className="daily-bonus-heading">бонусами каждый день</span></h1>
      <p className="daily-bonus-intro">Попробуйте IQ MENTOR</p>
      <p id="daily-bonus-description">Бонусов хватит на полноценный анализ нескольких звонков и проведение тренировок команды.<span className="daily-bonus-renewal">Лимиты обновляются в 00:00 — всего 10 раз за пробный период.</span></p>
      <button ref={startRef} className="daily-bonus-start" type="button" onClick={onStart}>Начать пользоваться</button>
    </div>}
  </dialog>;
}
