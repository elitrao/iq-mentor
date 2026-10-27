import { useEffect, useId, useRef, useState } from 'react';
import {
  IconAdjustmentsHorizontal, IconBell, IconBook2, IconChevronRight,
  IconHeadphones, IconPlugConnected, IconReportAnalytics, IconSchool,
  IconUsers,
} from '@tabler/icons-react';
import { SETTINGS_GROUPS, SETTINGS_PILL_SECTIONS, resolveSettingsSection } from './settings/schema.js';
import { SettingsSectionContent } from './SettingsWorkspace.jsx';
import './settings-pills.css';

const ICONS = {
  users: IconUsers,
  plug: IconPlugConnected,
  bell: IconBell,
  report: IconReportAnalytics,
  headphones: IconHeadphones,
};

const GROUP_ICONS = {
  general: IconAdjustmentsHorizontal,
  analyst: IconBook2,
  trainer: IconSchool,
};

export function SettingsPills({ active, setActive, renderSection }) {
  const id = useId();
  const buttonRefs = useRef({});
  const backRef = useRef(null);
  const focusAfterNavigation = useRef(null);
  const lastVisited = useRef({});
  const [showSection, setShowSection] = useState(false);
  const { item, parent } = resolveSettingsSection(active);
  const selected = parent?.id || item.id;
  const selectedSection = SETTINGS_PILL_SECTIONS.find((section) => section.id === selected);
  lastVisited.current[selected] = item.id;
  useEffect(() => {
    const destination = focusAfterNavigation.current;
    if (!destination) return;
    (showSection ? backRef.current : buttonRefs.current[destination])?.focus({ preventScroll: true });
    focusAfterNavigation.current = null;
  }, [showSection]);

  const select = (section) => {
    focusAfterNavigation.current = section;
    setActive(lastVisited.current[section] || section);
    setShowSection(true);
  };
  const returnToSections = () => {
    focusAfterNavigation.current = selected;
    setShowSection(false);
  };

  return <section className="settings-structure-workspace settings-pills-workspace" aria-label="Настройки">
    <header className={`settings-pills-header${showSection ? ' is-detail' : ''}`}>
      {showSection ? <nav className="settings-pills-breadcrumbs" aria-label="Навигация по настройкам"><ol>
        <li><button type="button" ref={backRef} onClick={returnToSections}>Настройки</button></li>
        <li><IconChevronRight size={14} aria-hidden="true" /><span aria-current="page">{selectedSection.label}</span></li>
      </ol></nav> : <div className="settings-pills-heading"><h1 id={`${id}-title`}>Настройки</h1>
      </div>}
    </header>
    {!showSection ? <div className="settings-card-directory">
      {SETTINGS_GROUPS.map((group) => {
        const GroupIcon = GROUP_ICONS[group.id];
        return <section className="settings-card-group" key={group.id} aria-labelledby={`${id}-group-${group.id}`}>
        <h2 id={`${id}-group-${group.id}`}>{GroupIcon && <GroupIcon size={16} stroke={1.4} aria-hidden="true" />}<span>{group.title}</span></h2>
        <div className="settings-section-cards" role="group" aria-label={`Настройки: ${group.title}`}>
          {SETTINGS_PILL_SECTIONS.filter((section) => section.group === group.id).map((section) => {
            const ItemIcon = ICONS[section.icon];
            const label = section.label.startsWith('Отчёты ·') ? 'Автоотчёты' : section.label;
            return <button type="button" key={section.id}
              ref={(node) => { buttonRefs.current[section.id] = node; }}
              className={`settings-section-card tone-${section.group}`}
              aria-label={`${label}. ${SETTINGS_GROUPS.find((group) => group.id === section.group)?.title}`}
              onClick={() => select(section.id)}>
              <span className="settings-section-card-icon" aria-hidden="true">{ItemIcon && <ItemIcon size={26} stroke={1.4} />}</span>
              <span className="settings-section-button-copy">{label}</span>
              <IconChevronRight className="settings-section-card-arrow" size={17} stroke={1.7} aria-hidden="true" />
            </button>;
          })}
        </div>
      </section>;
      })}
    </div> : <div className="settings-pills-panel" role="region" aria-label={selectedSection.label}>
      <SettingsSectionContent active={active} setActive={setActive} renderSection={renderSection} />
    </div>}
  </section>;
}
