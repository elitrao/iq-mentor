import { useEffect, useId, useRef, useState } from 'react';
import { IconWindow, IconChevronRight, IconPlayerPause, IconPlayerPlay } from '@tabler/icons-react';
import { SETTINGS_GROUPS, SETTINGS_PILL_SECTIONS, resolveSettingsSection } from './settings/schema.js';
import { SettingsGroupIcon, SettingsSectionContent } from './SettingsWorkspace.jsx';
import employeesRobot from './assets/robots/settings-poses/employees.png';
import integrationsRobot from './assets/robots/settings-poses/integrations.png';
import notificationsRobot from './assets/robots/settings-poses/notifications.png';
import reportsRobot from './assets/robots/settings-poses/analyst-reports.png';
import callsRobot from './assets/robots/settings-poses/call-assessment.png';
import trainerRobot from './assets/robots/settings-poses/trainer-reports.png';
import './settings-pills.css';

const ROBOTS = { employees: employeesRobot, integrations: integrationsRobot, notifications: notificationsRobot, 'analyst-reports': reportsRobot, 'call-assessment': callsRobot, 'trainer-reports': trainerRobot };

export function SettingsPills({ active, setActive, renderSection, openModal }) {
  const id = useId();
  const buttonRefs = useRef({});
  const backRef = useRef(null);
  const focusAfterNavigation = useRef(null);
  const lastVisited = useRef({});
  const [showSection, setShowSection] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const motionEnabled = !paused && !reduced;
  const { item, parent } = resolveSettingsSection(active);
  const selected = parent?.id || item.id;
  const selectedSection = SETTINGS_PILL_SECTIONS.find((section) => section.id === selected);
  useEffect(() => { lastVisited.current[selected] = item.id; }, [selected, item.id]);
  useEffect(() => {
    const destination = focusAfterNavigation.current;
    if (!destination) return;
    (showSection ? backRef.current : buttonRefs.current[destination])?.focus({ preventScroll: true });
    focusAfterNavigation.current = null;
  }, [showSection]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const select = (section) => {
    focusAfterNavigation.current = section;
    setActive(lastVisited.current[section] || section);
    setShowSection(true);
  };
  const returnToSections = () => {
    focusAfterNavigation.current = selected;
    setShowSection(false);
  };

  return <section className={`settings-structure-workspace settings-pills-workspace${motionEnabled ? '' : ' is-motion-paused'}`} aria-label="Настройки 4">
    <header className={`settings-pills-header${showSection ? ' is-detail' : ''}`}>
      {showSection ? <nav className="settings-pills-breadcrumbs" aria-label="Навигация по настройкам"><ol>
        <li><button type="button" ref={backRef} onClick={returnToSections}>Настройки</button></li>
        <li><IconChevronRight size={14} aria-hidden="true" /><span aria-current="page">{selectedSection.label}</span></li>
      </ol></nav> : <div className="settings-pills-heading"><h1 id={`${id}-title`}>Настройки 4</h1>
      </div>}
      <div className="settings-pills-header-actions">
        {!showSection && <button type="button" className="settings-pills-comparison settings-card-motion-control" onClick={() => setPaused((value) => !value)} aria-pressed={!motionEnabled} disabled={reduced} title={reduced ? 'Движение отключено в настройках системы' : undefined}>
          {motionEnabled ? <IconPlayerPause size={14} aria-hidden="true" /> : <IconPlayerPlay size={14} aria-hidden="true" />}{motionEnabled ? 'Пауза анимаций' : 'Включить анимации'}
        </button>}
        <button type="button" className="settings-pills-comparison" onClick={openModal} aria-haspopup="dialog"><IconWindow size={15} stroke={1.6} aria-hidden="true" />Настройки · в окне</button>
      </div>
    </header>
    {!showSection ? <div className="settings-overview-groups" role="group" aria-label="Разделы настроек">
      {SETTINGS_GROUPS.map((group) => <section key={group.id} className={`settings-overview-group group-${group.id}`} aria-labelledby={`${id}-group-${group.id}`}>
        <h2 className="settings-overview-group-title" id={`${id}-group-${group.id}`}><SettingsGroupIcon groupId={group.id} /><span>{group.title}</span></h2>
        <div className="settings-section-pills">
          {SETTINGS_PILL_SECTIONS.filter((section) => section.group === group.id).map((section) => <button type="button" key={section.id}
          ref={(node) => { buttonRefs.current[section.id] = node; }}
          className={`settings-section-pill tone-${section.group}`}
          aria-label={section.label}
          onClick={() => select(section.id)}>
          <span className="settings-card-art" aria-hidden="true"><img className="settings-card-robot" src={ROBOTS[section.id]} alt="" draggable="false" /></span>
          <span className="settings-section-button-copy">{section.label.startsWith('Отчёты ·') ? 'Автоотчёты' : section.label}</span>
          </button>)}
        </div>
      </section>)}
    </div> : <div className="settings-pills-panel" role="region" aria-label={selectedSection.label}>
      <SettingsSectionContent active={active} setActive={setActive} renderSection={renderSection} />
    </div>}
  </section>;
}
