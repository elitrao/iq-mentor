import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconX } from '@tabler/icons-react';
import dailyBonusGlow from './assets/welcome/daily-bonus-glow.png';
import './daily-bonus-notice.css';

// Visibility must come from an explicit bonus event, never from a page reload.
// This notice does not accrue money or alter the billing balance.
// Daily limits refresh at midnight; this component only displays the schedule.
export function DailyBonusNotice({ anchorRef, onClose, onStart, nextBonusLabel = 'в 00:00' }) {
  const noticeRef = useRef(null);
  const exitTimer = useRef(null);
  const closingRef = useRef(false);
  const [closing, setClosing] = useState(false);
  const [position, setPosition] = useState(null);
  const nextBonusTime = nextBonusLabel?.match(/^(.*?)(\d{1,2}:\d{2})$/);

  useEffect(() => () => window.clearTimeout(exitTimer.current), []);

  useLayoutEffect(() => {
    const placeNotice = () => {
      if (!anchorRef.current || !noticeRef.current) return;
      const anchor = anchorRef.current.getBoundingClientRect();
      // Layout dimensions stay stable while the entrance/exit scales the card.
      const notice = { width: noticeRef.current.offsetWidth, height: noticeRef.current.offsetHeight };
      const gutter = 12;
      setPosition({
        left: Math.max(gutter, Math.min(anchor.right - notice.width, window.innerWidth - notice.width - gutter)),
        top: Math.max(gutter, Math.min(anchor.bottom + 14, window.innerHeight - notice.height - gutter)),
      });
    };
    placeNotice();
    const observer = new ResizeObserver(placeNotice);
    observer.observe(anchorRef.current);
    observer.observe(noticeRef.current);
    window.addEventListener('resize', placeNotice);
    window.addEventListener('scroll', placeNotice, true);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', placeNotice);
      window.removeEventListener('scroll', placeNotice, true);
    };
  }, [anchorRef]);

  const leave = (action, restoreFocus = false) => {
    if (closingRef.current) return;
    closingRef.current = true;
    const finish = () => {
      if (restoreFocus) anchorRef.current?.focus({ preventScroll: true });
      action();
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    setClosing(true);
    exitTimer.current = window.setTimeout(finish, 240);
  };
  const dismiss = () => leave(onClose, true);

  return createPortal(<aside ref={noticeRef} className="daily-bonus-notice" aria-label="Дневной бонус"
    data-closing={closing}
    style={position ? position : { visibility: 'hidden' }}
    onKeyDown={(event) => { if (event.key === 'Escape') { event.stopPropagation(); dismiss(); } }}>
    <div className="daily-bonus-notice-art" aria-hidden="true"><img src={dailyBonusGlow} alt="" /></div>
    <button className="daily-bonus-notice-close" type="button" disabled={closing} onClick={dismiss} aria-label="Закрыть уведомление о бонусе"><IconX size={15} stroke={1.5} /></button>
    <div className="daily-bonus-notice-body">
      <div className="daily-bonus-notice-copy" role="status">
        <h2>Дневной бонус обновлён</h2><p>Сегодня доступно <strong>250 ₽</strong><br />на анализ звонков и тренировки.</p>
      </div>
      {nextBonusLabel && <p className="daily-bonus-notice-next">Следующее обновление лимитов — {nextBonusTime ? <>{nextBonusTime[1]}<strong>{nextBonusTime[2]}</strong></> : nextBonusLabel}</p>}
      <button className="daily-bonus-notice-action" type="button" disabled={closing} onClick={() => leave(onStart)}>Приступить</button>
    </div>
  </aside>, document.body);
}
