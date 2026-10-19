import { IconArrowUpRight, IconCopy, IconKey, IconRefresh } from '@tabler/icons-react';
import { IntegrationBreadcrumbs } from './IntegrationBreadcrumbs.jsx';
import './integration-detail-screens.css';

export function IntegrationScreen({ title, back, backRef, breadcrumbLabel = title, breadcrumbs, actions, className = '', children }) {
  return <section className={`service-reference-page ${className}`}>
    <IntegrationBreadcrumbs parentRef={backRef} items={breadcrumbs || [{ label: 'Интеграции', onClick: back }, { label: breadcrumbLabel }]} />
    <header className="service-page-header"><h2>{title}</h2>{actions && <div className="service-page-actions">{actions}</div>}</header>
    {children}
  </section>;
}

export function BitrixIntegrationScreen({ back, backRef, connected, token, regenerate, copy, disconnect }) {
  return <IntegrationScreen title="Интеграция с Б24" breadcrumbLabel="Bitrix24" back={back} backRef={backRef} className="bitrix-reference-page" actions={<a className="dark-button" href="https://www.bitrix24.ru/apps/app/iq_group.mentor/" target="_blank" rel="noopener noreferrer">Установить приложение<IconArrowUpRight size={21} aria-hidden="true" /></a>}>
    <div className="bitrix-reference-content">
      <div className="bitrix-reference-intro"><span>Интеграция с Битрикс24</span><h3>Интеграция позволяет связать сервис Б24 с IQ MENTOR</h3></div>
      <div className="bitrix-reference-copy">
        <p>При интеграции с Битрикс24 пользователь получает связку между сервисом и Б24. После настройки все новые звонки автоматически подтягиваются в CRM: фиксируются входящие и исходящие вызовы, номера, длительность, а также запись разговора. Звонки можно принимать прямо из интерфейса Битрикс24, без переключения между системами.</p>
        <p>Интеграция позволяет привязывать звонки к объектам CRM — сделкам, лидам и контактам. Дополнительно подгружается структура сотрудников из Битрикс24 и настраивается их связь с сервисом, чтобы звонки корректно распределялись по менеджерам.</p>
        <p>Подключение выполняется один раз через ключ-токен (набор символов), после чего система начинает работать в связке с Б24 в автоматическом режиме.</p>
      </div>
      <div className="service-reference-token-row">
        <label className="service-reference-token"><IconKey size={21} aria-hidden="true" /><input aria-label="Ключ-токен Bitrix24" readOnly value={'*'.repeat(80)} /></label>
        <button className="service-reference-copy" type="button" aria-label="Скопировать ключ-токен Bitrix24" onClick={() => copy(token)}><IconCopy size={21} aria-hidden="true" /></button>
        <button className="orange-button" type="button" onClick={regenerate}><IconRefresh size={20} aria-hidden="true" />{connected ? 'Перегенерировать' : 'Создать токен'}</button>
      </div>
      {connected && <button className="integration-disconnect" type="button" onClick={disconnect}>Отключить интеграцию</button>}
    </div>
  </IntegrationScreen>;
}

export function YandexIntegrationScreen({ back, backRef, connected, toggle }) {
  return <IntegrationScreen title="Интеграция Яндекс.Диск" breadcrumbLabel="Яндекс Диск" back={back} backRef={backRef} className="yandex-reference-page">
    <aside className="yandex-reference-warning"><h3>Важно</h3><p>Переносятся только звонки, которые появятся в папке после подключения.<br />То, что лежало там раньше, мы не трогаем и не импортируем.</p></aside>
    <div className="yandex-reference-connect">
      <span className={connected ? 'connected' : ''}>{connected ? 'Яндекс Диск подключен' : 'Яндекс Диск не подключен'}</span>
      <h3>{connected ? 'Записи звонков синхронизируются' : 'Подключите Яндекс Диск'}</h3>
      <p>{connected ? 'Новые записи из выбранной папки автоматически переносятся в Аналитик.' : 'Дайте доступ к папке на Диске. Мы будем автоматически забирать оттуда новые записи звонков и переносить их в Аналитик'}</p>
      <button className={connected ? 'light-button' : 'dark-button'} type="button" onClick={toggle}>{connected ? 'Отключить' : 'Войти через Яндекс'}</button>
    </div>
  </IntegrationScreen>;
}
