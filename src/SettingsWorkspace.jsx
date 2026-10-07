import { useLayoutEffect, useRef, useState } from 'react';
import {
  IconUsers, IconPlugConnected, IconBell, IconReportAnalytics,
  IconHeadphones,
  IconFolder, IconChevronDown, IconChevronRight, IconPointFilled,
} from '@tabler/icons-react';
import { SETTINGS_GROUPS, resolveSettingsSection } from './settings/schema.js';
import { CriteriaTemplates } from './CriteriaTemplates.jsx';
import { DocumentsExperience } from './DocumentsExperience.jsx';
import './settings-workspace.css';

const ICONS = {
  users: IconUsers, plug: IconPlugConnected, bell: IconBell, report: IconReportAnalytics,
  headphones: IconHeadphones,
  folder: IconFolder,
};

function SettingsNav({ active, setActive }) {
  const [expanded, setExpanded] = useState({ 'analyst-reports': false, 'trainer-reports': false, criteria: false });
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
              if (item.id === 'criteria') {
                setExpanded((current) => ({ ...current, [item.id]: active === item.id || containsActive ? !current[item.id] : true }));
                setActive(item.id);
                return;
              }
              setExpanded((current) => ({ ...current, [item.id]: containsActive ? !current[item.id] : true }));
              if (!containsActive) setActive(item.children[0].id);
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

export function SettingsWorkspace({ active, setActive, settings, update, notify, renderSection }) {
  const { group, item, parent } = resolveSettingsSection(active);
  const ActiveIcon = ICONS[item.icon || parent?.icon];
  const header = <header className="settings-content-head"><div className="settings-title-icon"><ActiveIcon size={23} stroke={1.7} /></div><div><span className="settings-kicker">{group.title}{parent && ` / ${parent.label}`}</span><h2>{item.id === 'criteria' ? 'Шаблоны' : item.label}</h2></div></header>;
  return <section className="settings-structure-workspace">
    <h1>Настройки</h1>
    <div className="settings-structure-layout">
      <SettingsNav active={item.id} setActive={setActive} />
      <main className={`settings-content settings-structure-content tone-${group.id}${item.id === 'criteria' ? ' criteria-content' : ''}`}>
        {item.id === 'documents' ? <DocumentsExperience key="documents" header={header}>{renderSection(item.id)}</DocumentsExperience> : <>{header}<div key={item.id} className="settings-section-body">
          {item.id === 'criteria' ? <CriteriaTemplates settings={settings} update={update} notify={notify} /> : renderSection(item.id)}
        </div></>}
      </main>
    </div>
  </section>;
}
