import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconArrowRight, IconGift, IconLock, IconPlugConnected, IconUpload, IconWallet, IconX } from '@tabler/icons-react';
import integrationsIcon from './assets/sidebar/integrations.png';
import chevronUpIcon from './assets/sidebar/chevron-up.png';
import './bonus-preview.css';

export const BONUS_INTEGRATIONS_HINT = 'Интеграции недоступны во время бонусной программы';

export function isBonusPreviewPath(pathname) {
  return /^\/bonus\/?$/.test(pathname);
}

export function BonusIntegrationNav({ active, compact, onTopUp }) {
  const [feedback, setFeedback] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(false);
  const [noticePosition, setNoticePosition] = useState({});
  const triggerRef = useRef(null);
  const noticeRef = useRef(null);
  const animationRef = useRef(null);
  const feedbackTimer = useRef(null);
  const noticeTimer = useRef(null);
  const hintId = useId();
  const revealNotice = () => {
    if (compact || !noticeRef.current || !triggerRef.current) return;
    const nav = triggerRef.current.closest('.sidebar-nav');
    if (!nav) return;
    const overflow = noticeRef.current.getBoundingClientRect().bottom - nav.getBoundingClientRect().bottom + 12;
    if (overflow > 0) nav.scrollTop += overflow;
  };
  useEffect(() => () => {
    window.clearTimeout(feedbackTimer.current);
    window.clearTimeout(noticeTimer.current);
    animationRef.current?.cancel();
  }, []);
  useEffect(() => { setNoticeVisible(false); }, [compact]);
  useEffect(() => {
    if (!noticeVisible || compact) return;
    const scrollTimer = window.setTimeout(revealNotice, 260);
    return () => window.clearTimeout(scrollTimer);
  }, [noticeVisible, compact]);

  const showLockedFeedback = () => {
    const bounds = triggerRef.current.getBoundingClientRect();
    setNoticePosition({ left: Math.max(12, Math.min(bounds.left, window.innerWidth - 272)), top: Math.min(bounds.bottom + 6, window.innerHeight - 136) });
    setFeedback(true);
    setNoticeVisible(true);
    window.clearTimeout(feedbackTimer.current);
    window.clearTimeout(noticeTimer.current);
    feedbackTimer.current = window.setTimeout(() => setFeedback(false), 700);
    noticeTimer.current = window.setTimeout(() => setNoticeVisible(false), 6000);
    animationRef.current?.cancel();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    animationRef.current = triggerRef.current.animate(
      [0, -3, 3, -2, 2, 0].map(x => ({ transform: `translateX(${x}px)` })),
      { duration: 360, easing: 'ease-in-out' },
    );
  };
  const pauseNotice = () => window.clearTimeout(noticeTimer.current);
  const resumeNotice = () => {
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNoticeVisible(false), 6000);
  };

  const notice = <div ref={noticeRef} className={`bonus-locked-notice-wrap${noticeVisible ? ' is-visible' : ''}${compact ? ' is-compact' : ''}`}
    style={compact ? noticePosition : undefined} aria-hidden={!noticeVisible} inert={!noticeVisible}
    onTransitionEnd={event => { if (noticeVisible && event.target === event.currentTarget && event.propertyName === 'grid-template-rows') revealNotice(); }}
    onPointerEnter={pauseNotice} onPointerLeave={event => { if (!event.currentTarget.contains(document.activeElement)) resumeNotice(); }}
    onFocusCapture={pauseNotice} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) resumeNotice(); }}>
    <div className="bonus-locked-notice-clip"><div className="bonus-locked-notice">
      <span className="bonus-locked-notice-icon" aria-hidden="true"><IconWallet size={16} stroke={1.7} /></span>
      <p><strong>Пополните баланс,</strong> чтобы открыть интеграции.</p>
      <button className="bonus-locked-notice-close" type="button" aria-label="Закрыть подсказку об интеграциях" onClick={() => {
        window.clearTimeout(noticeTimer.current);
        setNoticeVisible(false);
        triggerRef.current?.focus();
      }}><IconX size={14} stroke={1.7} /></button>
      <button className="bonus-locked-notice-cta" type="button" onClick={() => { setNoticeVisible(false); onTopUp(); }}>
        Пополнить баланс <IconArrowRight size={13} stroke={1.8} aria-hidden="true" />
      </button>
    </div></div>
  </div>;

  return <div className="bonus-integration-nav-row">
    <button ref={triggerRef} type="button" className={`nav-item bonus-integration-nav${active ? ' active' : ''}${compact ? ' is-compact' : ''}${feedback ? ' is-blocked-feedback' : ''}`}
      aria-label="Интеграции — недоступны в бонусный период" aria-disabled="true" aria-describedby={hintId}
      title={BONUS_INTEGRATIONS_HINT} onClick={showLockedFeedback}>
      <img className="bonus-integrations-icon" src={integrationsIcon} alt="" width="16" height="16" />
      <span>Интеграции</span>
      <IconLock className="bonus-nav-lock" size={14} stroke={1.7} aria-hidden="true" />
      <img className="bonus-nav-chevron" src={chevronUpIcon} alt="" width="16" height="16" />
    </button>
    <span id={hintId} className="nav-reorder-sr-only">{BONUS_INTEGRATIONS_HINT}</span>
    <span className="nav-reorder-sr-only" role="status">{noticeVisible ? 'Пополните баланс, чтобы открыть интеграции.' : ''}</span>
    {compact ? createPortal(notice, document.body) : notice}
  </div>;
}

export function BonusIntegrationsLocked({ embedded = false, onManualUpload }) {
  const Heading = embedded ? 'h2' : 'h1';
  const MessageHeading = embedded ? 'h3' : 'h2';
  return <section className={`bonus-integrations-page${embedded ? ' is-embedded' : ''}`} aria-label="Интеграции в бонусный период">
    <Heading className="bonus-integrations-title">Интеграции</Heading>
    <div className="bonus-integration-gate">
      <span className="bonus-program-label"><IconGift size={15} stroke={1.7} aria-hidden="true" />Бонусная программа</span>
      <div className="bonus-integration-illustration" aria-hidden="true">
        <IconPlugConnected size={36} stroke={1.3} />
        <span><IconLock size={18} stroke={1.8} /></span>
      </div>
      <MessageHeading>Интеграции пока недоступны</MessageHeading>
      <p>Во время бонусной программы подключение интеграций недоступно. Для анализа загружайте записи звонков вручную.</p>
      <button type="button" className="bonus-manual-upload" onClick={onManualUpload}>
        <IconUpload size={17} stroke={1.7} aria-hidden="true" /><span>Перейти к звонкам</span><IconArrowRight size={16} stroke={1.7} aria-hidden="true" />
      </button>
      <span className="bonus-manual-hint">В отчёте по звонкам нажмите «Загрузить звонки»</span>
    </div>
  </section>;
}
