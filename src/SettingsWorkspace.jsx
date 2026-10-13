import { useLayoutEffect, useRef, useState } from 'react';
import {
  IconUsers, IconPlugConnected, IconBell, IconReportAnalytics,
  IconHeadphones,
  IconChevronDown, IconChevronRight, IconPointFilled,
} from '@tabler/icons-react';
import { SETTINGS_GROUPS, resolveSettingsSection } from './settings/schema.js';
import analystRobot from './assets/robots/analyst-orange.png';
import trainerRobot from './assets/robots/trainer-purple.png';
import analystCircuitPattern from './assets/robots/analyst-circuit-pattern.png';
import trainerCircuitPattern from './assets/robots/trainer-circuit-pattern.png';
import './settings-workspace.css';

const ICONS = {
  users: IconUsers, plug: IconPlugConnected, bell: IconBell, report: IconReportAnalytics,
  headphones: IconHeadphones,
};

const REPORT_CARD_DETAILS = {
  calls: { eyebrow: 'Диалоги', description: 'Отчёт по звонкам и качеству разговоров' },
  summary: { eyebrow: 'Динамика', description: 'Главные показатели в одном отчёте' },
  categories: { eyebrow: 'Структура', description: 'Результаты по категориям оценки' },
  training: { eyebrow: 'Практика', description: 'Результаты тренировок сотрудников' },
};

function ReportOverview({ group, item, onSelect }) {
  const robot = group.id === 'trainer' ? trainerRobot : analystRobot;
  const pattern = group.id === 'trainer' ? trainerCircuitPattern : analystCircuitPattern;
  return <section className={`report-overview report-overview-${group.id}`} aria-labelledby="report-overview-title">
    <div className="report-overview-intro">
      <span>Автоматические отчёты</span>
      <h3 id="report-overview-title">Что будем собирать?</h3>
      <p>Выберите тип отчёта — внутри можно настроить его периодичность.</p>
    </div>
    <div className={`report-overview-grid report-overview-grid-${item.children.length}`}>
      {item.children.map((child, index) => {
        const details = REPORT_CARD_DETAILS[child.reportType];
        return <button className="report-overview-card" type="button" key={child.id} onClick={() => onSelect(child.id)} aria-label={`Открыть отчёт «${child.label}»`}>
          <img className="selection-card-pattern" src={pattern} alt="" />
          <img className="selection-card-robot report-card-robot" src={robot} alt="" />
          <span className="report-card-topline"><span>{String(index + 1).padStart(2, '0')}</span><small>{details.eyebrow}</small></span>
          <span className="report-card-copy"><strong>{child.label}</strong><span>{details.description}</span></span>
          <span className="selection-card-action">Настроить</span>
        </button>;
      })}
    </div>
  </section>;
}

function SettingsNav({ active, setActive }) {
  const [expanded, setExpanded] = useState({ 'analyst-reports': false, 'trainer-reports': false });
  const navRef = useRef(null);
  const [highlight, setHighlight] = useState(null);
  useLayoutEffect(() => {
    const nav = navRef.current;
    const measure = () => {
      // Keep the selected parent highlighted while its active child is collapsed.
      const selected = nav.querySelector('.settings-structure-item.active') || nav.querySelector('.settings-structure-item.contains-active');
      if (!selected) return;
      const row = selected.getBoundingClientRect();
      const bounds = nav.getBoundingClientRect();
      const next = { x: row.left - bounds.left + nav.scrollLeft, y: row.top - bounds.top + nav.scrollTop, width: row.width, height: row.height, color: getComputedStyle(selected).getPropertyValue('--settings-selection-fill').trim() };
      setHighlight((current) => current && Object.keys(next).every((key) => current[key] === next[key]) ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [active, expanded]);
  return <nav ref={navRef} className="settings-structure-nav" aria-label="Разделы настроек">
    {highlight && <div className="settings-nav-highlight" aria-hidden="true" style={{ transform: `translate(${highlight.x}px, ${highlight.y}px)`, width: highlight.width, height: highlight.height, backgroundColor: highlight.color }} />}
    {SETTINGS_GROUPS.map((group) => <section className={`settings-structure-group tone-${group.id}`} key={group.id} aria-labelledby={`settings-group-${group.id}`}>
      <h2 id={`settings-group-${group.id}`}>{group.title}</h2>
      {group.items.map((item) => {
        const Icon = ICONS[item.icon];
        const containsActive = item.children?.some((child) => child.id === active);
        return <div key={item.id}>
          <button type="button" className={`settings-structure-item${active === item.id ? ' active' : ''}${containsActive ? ' contains-active' : ''}`} aria-current={active === item.id ? 'page' : undefined} aria-expanded={item.children ? expanded[item.id] : undefined} aria-controls={item.children ? `children-${item.id}` : undefined} onClick={() => {
            if (item.children) {
              setExpanded((current) => ({ ...current, [item.id]: active === item.id ? !current[item.id] : true }));
              setActive(item.id);
            } else setActive(item.id);
          }}>
            <Icon size={20} stroke={1.8} /><span>{item.label}</span>
            {item.children && (expanded[item.id] ? <IconChevronDown size={15} /> : <IconChevronRight size={15} />)}
          </button>
          {item.children && expanded[item.id] && <div className="settings-structure-children" id={`children-${item.id}`}>
            {item.children.map((child) => <button className={`settings-structure-item${active === child.id ? ' active' : ''}`} type="button" key={child.id} aria-label={`${group.title}: ${child.label}`} aria-current={active === child.id ? 'page' : undefined} onClick={() => setActive(child.id)}><IconPointFilled className="settings-subsection-icon" size={14} aria-hidden="true" /><span>{child.label}</span></button>)}
          </div>}
        </div>;
      })}
    </section>)}
  </nav>;
}

export function SettingsWorkspace({ active, setActive, settings, update, notify, renderSection, modal = false }) {
  const { group, item, parent } = resolveSettingsSection(active);
  const contentScrollRef = useRef(null);
  useLayoutEffect(() => {
    if (modal && contentScrollRef.current) contentScrollRef.current.scrollTop = 0;
  }, [item.id, modal]);
  const ActiveIcon = ICONS[item.icon || parent?.icon];
  const header = <header className="settings-content-head"><div className="settings-title-icon"><ActiveIcon size={23} stroke={1.7} /></div><div><span className="settings-kicker">{group.title}{parent && ` / ${parent.label}`}</span><h2>{item.label}</h2></div></header>;
  return <section className="settings-structure-workspace">
    {!modal && <h1>Настройки</h1>}
    <div className="settings-structure-layout">
      {modal ? <aside className="settings-modal-sidebar"><h1 id="settings-modal-title">Настройки</h1><SettingsNav active={item.id} setActive={setActive} /></aside> : <SettingsNav active={item.id} setActive={setActive} />}
      <div ref={contentScrollRef} className={modal ? 'settings-modal-content-scroll' : undefined}>
      <main className={`settings-content settings-structure-content tone-${group.id}`}>
        {header}<div key={item.id} className="settings-section-body">{item.children ? <ReportOverview group={group} item={item} onSelect={setActive} /> : renderSection(item.id)}</div>
      </main>
      </div>
    </div>
  </section>;
}
