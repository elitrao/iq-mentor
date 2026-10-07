import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconFileText } from '@tabler/icons-react';

const EXPLANATION = 'Загрузите скрипт или инструкцию. ИИ определит, что нужно проверять в звонках, и создаст критерии оценки. Добавьте их в шаблон, чтобы звонки сотрудников проверялись по правилам вашей компании.';

export function DocumentsExperience({ header, children }) {
  const [phase, setPhase] = useState('blank');
  const copyRef = useRef(null);
  const originRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('ready');
      return;
    }
    const reveal = window.setTimeout(() => setPhase('intro'), 400);
    // Hold the explanation for 6.5 seconds after its 800ms entrance.
    const collapse = window.setTimeout(() => {
      originRef.current = copyRef.current?.getBoundingClientRect();
      setPhase('collapsing');
    }, 7700);
    const finish = window.setTimeout(() => setPhase('ready'), 8700);
    return () => {
      [reveal, collapse, finish].forEach(window.clearTimeout);
      animationRef.current?.cancel();
    };
  }, []);

  useLayoutEffect(() => {
    if (phase !== 'collapsing' || !originRef.current || !copyRef.current) return;
    const copy = copyRef.current;
    const before = originRef.current;
    const after = copy.getBoundingClientRect();
    animationRef.current = copy.animate([
      { transform: `translate(${before.x - after.x}px, ${before.y - after.y}px)`, fontSize: '17px', lineHeight: '28px', opacity: 1 },
      { transform: 'translate(0, 0)', fontSize: '13px', lineHeight: '21px', opacity: 1 },
    ], { duration: 1000, easing: 'cubic-bezier(.22,1,.36,1)' });
  }, [phase]);

  const compact = phase === 'collapsing' || phase === 'ready';
  return <div className={`documents-experience phase-${phase}`} data-phase={phase}>
    <div className={`documents-experience-banner${compact ? ' is-compact' : ''}`}>
      <div className="documents-experience-heading" aria-hidden={!compact}>{header}</div>
      <p ref={copyRef} className="documents-experience-copy" aria-hidden={phase === 'blank'}>{EXPLANATION}</p>
    </div>
    <div className="documents-experience-lead" aria-hidden={phase !== 'intro'}>
      <span className="documents-experience-symbol"><IconFileText size={26} stroke={1.4} aria-hidden="true" /></span>
      <h3>Ваши документы становятся правилами</h3>
    </div>
    {phase === 'ready' && <div className="documents-experience-controls">{children}</div>}
  </div>;
}
