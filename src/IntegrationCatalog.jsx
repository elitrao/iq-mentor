import { IconSettings, IconPlus, IconCode, IconCheck } from '@tabler/icons-react';
import bitrix24Logo from './assets/integrations/bitrix24.png';
import amoCrmLogo from './assets/integrations/amocrm.png';
import yandexDiskLogo from './assets/integrations/yandex-disk-official.png';
import { filterIntegrations, INTEGRATION_SERVICES } from './settings/integration-catalog.js';
import './integration-catalog.css';

const logos = { bitrix: bitrix24Logo, yandex: yandexDiskLogo, amo: amoCrmLogo };

export function IntegrationLogo({ service, large = false, decorative = false }) {
  const name = INTEGRATION_SERVICES.find((item) => item.key === service)?.name;
  if (service === 'api') return <span className={`service-brand-logo service-brand-logo-api${large ? ' large' : ''}`} role={decorative ? undefined : 'img'} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : 'API'}><IconCode size={23} stroke={1.7} /></span>;
  return <img className={`service-brand-logo service-brand-logo-${service}${large ? ' large' : ''}`} src={logos[service]} alt={decorative ? '' : `Логотип ${name}`} />;
}

export function IntegrationCatalog({ value, onSelect }) {
  const connectedServices = INTEGRATION_SERVICES.filter((service) => value[service.key]?.connected);
  const visibleServices = filterIntegrations('', 'all', value);

  return <section className="integration-catalog" aria-label="Каталог интеграций">
    <header className="integration-catalog-header">
      <h2 id="integration-catalog-title" tabIndex={-1}>Интеграции</h2>
    </header>

    <section id="integration-connected-results" className="integration-catalog-connected" aria-labelledby="integration-connected-title">
      <h3 id="integration-connected-title">Активные</h3>
      {connectedServices.length ? <div className="integration-catalog-grid">{connectedServices.map((service) => <button
        className="integration-catalog-service" type="button" key={service.key} id={`integration-connected-${service.key}`}
        onClick={(event) => onSelect(service.key, event.currentTarget.id)} aria-label={`Настроить подключённую интеграцию «${service.name}»`}
      >
        <IntegrationLogo service={service.key} decorative />
        <span className="integration-catalog-service-copy"><span className="integration-catalog-service-title"><strong>{service.name}</strong><span className="integration-connected-badge"><IconCheck size={12} stroke={2.4} aria-hidden="true" />Подключено</span></span><span>{service.description}</span></span>
        <span className="integration-catalog-service-action" title="Настроить"><IconSettings size={18} stroke={1.5} aria-hidden="true" /></span>
      </button>)}</div> : <p className="integration-connected-empty">Пока нет подключённых сервисов. Выберите интеграцию ниже.</p>}
    </section>

    <section id="integration-catalog-results" className="integration-catalog-results" aria-labelledby="integration-results-title">
      <div className="integration-catalog-results-head"><h3 id="integration-results-title">Все интеграции</h3><span role="status" aria-label={`Доступно интеграций: ${visibleServices.length}`}>{visibleServices.length}</span></div>
      {visibleServices.length ? <div className="integration-catalog-grid">{visibleServices.map((service) => {
        return <button className="integration-catalog-service" type="button" key={service.key} id={`integration-catalog-${service.key}`}
          onClick={(event) => onSelect(service.key, event.currentTarget.id)} aria-label={`Открыть интеграцию «${service.name}», настроить подключение`}
        >
          <IntegrationLogo service={service.key} decorative />
          <span className="integration-catalog-service-copy"><strong>{service.name}</strong><span>{service.description}</span></span>
          <span className="integration-catalog-service-action" title="Подключить"><IconPlus size={20} stroke={1.6} aria-hidden="true" /></span>
        </button>;
      })}</div> : <div className="integration-catalog-empty">
        <strong>Все сервисы подключены</strong>
        <p>Управляйте ими в блоке «Активные» выше.</p>
      </div>}
    </section>
  </section>;
}
