import { useId, useLayoutEffect, useRef, useState } from 'react';
import {
  IconUsers, IconPlugConnected, IconBell, IconReportAnalytics,
  IconHeadphones, IconChevronDown,
} from '@tabler/icons-react';
import { SETTINGS_GROUPS, resolveSettingsSection } from './settings/schema.js';
import { ReportTypeTabs } from './ReportTypeTabs.jsx';
import analystIcon from './assets/notification-analyst.png';
import trainerIcon from './assets/notification-trainer.png';
import './settings-workspace.css';
import './report-settings.css';
import './stereo-settings.css';

const ICONS = {
  users: IconUsers, plug: IconPlugConnected, bell: IconBell, report: IconReportAnalytics,
  headphones: IconHeadphones,
};

function SettingsGroupProductIcon({ product, src }) {
  const id = useId();
  const trainer = product === 'trainer';
  const size = trainer ? 80 : 32;
  return <svg className="settings-group-product-icon" viewBox={trainer ? '26 26 28 28' : '0 0 32 32'} aria-hidden="true" focusable="false">
    <defs>
      <filter id={`${id}-alpha`}><feComponentTransfer><feFuncA type="linear" slope={trainer ? 255 / 76 : 1} /></feComponentTransfer></filter>
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width={size} height={size} style={{ maskType: 'alpha' }}>
        <image href={src} width={size} height={size} filter={`url(#${id}-alpha)`} />
      </mask>
    </defs>
    <rect width={size} height={size} fill="currentColor" mask={`url(#${id}-mask)`} />
  </svg>;
}

export function SettingsGroupIcon({ groupId }) {
  if (groupId === 'general') return <svg className="settings-group-general-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <path d="M2 3.5h12M2 8h12M2 12.5h12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="4" y="1.5" width="3" height="4" rx="1" fill="currentColor" />
    <rect x="9" y="6" width="3" height="4" rx="1" fill="currentColor" />
    <rect x="5" y="10.5" width="3" height="4" rx="1" fill="currentColor" />
  </svg>;
  const icon = groupId === 'analyst' ? analystIcon : groupId === 'trainer' ? trainerIcon : null;
  return icon ? <SettingsGroupProductIcon product={groupId} src={icon} /> : null;
}

function ReportOverview({ group, item, active, onSelect, renderSection }) {
  const id = useId();
  const selected = item.children.some((child) => child.id === active) ? active : item.children[0].id;
  return <section className={`report-directory tone-${group.id}`} aria-labelledby={`${id}-title`}>
    <h2 id={`${id}-title`}>{item.label}</h2>
    <ReportTypeTabs items={item.children} active={selected} tone={group.id} id={id} onChange={onSelect} label={item.id === 'call-assessment' ? 'Настройки оценки звонков' : 'Тип отчёта'} />
    <div className="notification-product-panels report-type-panels">
      {item.children.map((child) => <div key={child.id} className={`notification-product-panel${selected === child.id ? ' is-active' : ''}`}
        role="tabpanel" id={`${id}-panel-${child.id}`} aria-labelledby={`${id}-tab-${child.id}`}
        aria-hidden={selected !== child.id} inert={selected !== child.id}>
        {renderSection(child.id)}
      </div>)}
    </div>
  </section>;
}

function SettingsNav({ active, setActive }) {
  const navRef = useRef(null);
  const [collapsed, setCollapsed] = useState({});
  const [highlight, setHighlight] = useState(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = () => {
      const selected = nav.querySelector('.settings-structure-item.active') || nav.querySelector('.settings-structure-item.contains-active');
      if (!selected || selected.closest('[inert]')) { setHighlight(null); return; }
      const row = selected.getBoundingClientRect();
      const bounds = nav.getBoundingClientRect();
      const next = { x: row.left - bounds.left + nav.scrollLeft, y: row.top - bounds.top + nav.scrollTop, width: row.width, height: row.height };
      setHighlight((current) => current && Object.keys(next).every((key) => current[key] === next[key]) ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active, collapsed]);
  return <nav ref={navRef} className="settings-structure-nav" aria-label="Разделы настроек">
    {highlight && <div className="settings-nav-highlight" aria-hidden="true" style={{ transform: `translate(${highlight.x}px, ${highlight.y}px)`, width: highlight.width, height: highlight.height }} />}
    {SETTINGS_GROUPS.map((group) => <section className={`settings-structure-group tone-${group.id}`} key={group.id} aria-labelledby={`settings-group-${group.id}`}>
      <h2 id={`settings-group-${group.id}`}><button type="button" className="settings-group-toggle" aria-expanded={!collapsed[group.id]} aria-controls={`settings-group-items-${group.id}`} onClick={() => setCollapsed((current) => ({ ...current, [group.id]: !current[group.id] }))}><SettingsGroupIcon groupId={group.id} /><span>{group.title}</span><IconChevronDown className="settings-group-chevron" size={14} stroke={1.6} aria-hidden="true" /></button></h2>
      <div id={`settings-group-items-${group.id}`} className={`settings-group-collapse${collapsed[group.id] ? ' is-collapsed' : ''}`} aria-hidden={!!collapsed[group.id]} inert={!!collapsed[group.id]}><div className="settings-group-items">
      {group.items.map((item) => {
        const ItemIcon = ICONS[item.icon];
        const containsActive = item.children?.some((child) => child.id === active);
        return <div key={item.id}>
          <button type="button" className={`settings-structure-item${active === item.id ? ' active' : ''}${containsActive ? ' contains-active' : ''}`} aria-current={active === item.id || containsActive ? 'page' : undefined} onClick={() => setActive(item.id)}>
            {ItemIcon && <ItemIcon size={16} stroke={1.6} aria-hidden="true" />}
            <span className="settings-item-label" title={item.label}>{item.label}</span>
          </button>
        </div>;
      })}
      </div></div>
    </section>)}
  </nav>;
}

export function SettingsSectionContent({ active, setActive, renderSection }) {
  const { group, item, parent } = resolveSettingsSection(active);
  const reportParent = item.children ? item : parent;
  const ActiveIcon = ICONS[item.icon || parent?.icon];
  const header = <header className="settings-content-head"><div className="settings-title-icon"><ActiveIcon size={23} stroke={1.7} /></div><div><span className="settings-kicker">{group.title}{parent && ` / ${parent.label}`}</span><h2>{item.label}</h2></div></header>;
  return <section className={`settings-content settings-structure-content tone-${group.id}${reportParent ? ' report-settings-page' : ''}`}>
    {!reportParent && !['employees', 'integrations', 'notifications', 'stereo'].includes(item.id) && header}
    <div key={reportParent?.id || item.id} className="settings-section-body">{reportParent ? <ReportOverview group={group} item={reportParent} active={item.id} onSelect={setActive} renderSection={renderSection} /> : renderSection(item.id)}</div>
  </section>;
}

export function SettingsWorkspace({ active, setActive, settings, update, notify, renderSection, modal = false, title = 'Настройки', headerActions, sidebarActions }) {
  const { item } = resolveSettingsSection(active);
  const contentScrollRef = useRef(null);
  useLayoutEffect(() => {
    if (modal && contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  }, [item.id, modal]);
  return <section className={`settings-structure-workspace${modal ? '' : ' settings-page-workspace'}`}>
    {!modal && <><h1>{title}</h1>{headerActions}</>}
    <div className="settings-structure-layout">
      {modal ? <aside className="settings-modal-sidebar"><h1 id="settings-modal-title">{title}</h1>{sidebarActions}<SettingsNav active={item.id} setActive={setActive} /></aside> : <SettingsNav active={item.id} setActive={setActive} />}
      <div ref={contentScrollRef} className={modal ? 'settings-modal-content-scroll' : undefined}>
        <SettingsSectionContent active={active} setActive={setActive} renderSection={renderSection} />
      </div>
    </div>
  </section>;
}
