import { IconArrowRight, IconGift, IconLock, IconPlugConnected, IconUpload } from '@tabler/icons-react';
import './bonus-preview.css';

export const BONUS_INTEGRATIONS_HINT = 'Интеграции недоступны во время бонусной программы';

export function isBonusPreviewPath(pathname) {
  return /^\/bonus\/?$/.test(pathname);
}

export function BonusIntegrationNav({ active, onOpen }) {
  return <div className="bonus-integration-nav-row">
    <button type="button" className={`nav-item bonus-integration-nav${active ? ' active' : ''}`}
      aria-label="Интеграции — недоступны в бонусный период" aria-current={active ? 'page' : undefined}
      title={BONUS_INTEGRATIONS_HINT} onClick={onOpen}>
      <IconPlugConnected size={17} stroke={1.7} aria-hidden="true" />
      <span>Интеграции</span>
      <IconLock className="bonus-nav-lock" size={16} stroke={1.7} aria-hidden="true" />
    </button>
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
