import { IconArrowRight, IconGift, IconLock, IconPlugConnected, IconRefresh, IconWallet } from '@tabler/icons-react';
import './bonus-preview.css';

export const BONUS_INTEGRATIONS_HINT = 'Интеграции недоступны в бесплатный период';

export function isBonusPreviewPath(pathname) {
  return /^\/bonus\/?$/.test(pathname);
}

export function BonusPreviewControls({ onShow }) {
  return <div className="bonus-preview-controls" role="group" aria-label="Бонусные плашки">
    <button type="button" onClick={() => onShow('welcome')} aria-haspopup="dialog"><IconGift size={17} stroke={1.7} aria-hidden="true" />Приветствие</button>
    <button type="button" onClick={() => onShow('renewal')}><IconRefresh size={17} stroke={1.7} aria-hidden="true" />Обновление баланса</button>
    <button type="button" onClick={() => onShow('topped-up')} aria-haspopup="dialog"><IconWallet size={17} stroke={1.7} aria-hidden="true" />Пополнение баланса</button>
  </div>;
}

export function BonusIntegrationsLocked({ embedded = false, onTopUp }) {
  const Heading = embedded ? 'h2' : 'h1';
  const MessageHeading = embedded ? 'h3' : 'h2';
  return <section className={`bonus-integrations-page${embedded ? ' is-embedded' : ''}`} aria-label="Интеграции в бесплатный период">
    <Heading className="bonus-integrations-title">Интеграции</Heading>
    <div className="bonus-integration-gate">
      <div className="bonus-integration-illustration" aria-hidden="true">
        <IconPlugConnected size={36} stroke={1.3} />
        <span><IconLock size={18} stroke={1.8} /></span>
      </div>
      <MessageHeading>Интеграции недоступны</MessageHeading>
      <p>Интеграции недоступны в бесплатный период. Пополните баланс, чтобы подключить их.</p>
      <button type="button" className="bonus-topup-button" onClick={onTopUp}>
        <IconWallet size={17} stroke={1.7} aria-hidden="true" /><span>Пополнить баланс</span><IconArrowRight size={16} stroke={1.7} aria-hidden="true" />
      </button>
    </div>
  </section>;
}
