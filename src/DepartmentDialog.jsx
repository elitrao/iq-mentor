import { useState } from 'react';
import { IconCheck, IconFolder, IconUsers, IconBriefcase, IconPhone, IconHeadset, IconChartBar, IconCode, IconPalette, IconSpeakerphone, IconCoin, IconRocket, IconCircleOff } from '@tabler/icons-react';
import { ApiDialog } from './ApiDialog.jsx';
import { DEPARTMENT_COLORS, DEPARTMENT_ICONS, departmentColor } from './settings/departments.js';
import './api-integrations.css';

const ICONS = { none: IconCircleOff, folder: IconFolder, users: IconUsers, briefcase: IconBriefcase, phone: IconPhone, headset: IconHeadset, chart: IconChartBar, code: IconCode, palette: IconPalette, megaphone: IconSpeakerphone, coin: IconCoin, rocket: IconRocket };

export function DepartmentBadge({ department, name }) {
  const palette = departmentColor(department?.colorId);
  const Icon = department?.iconId !== 'none' && ICONS[department?.iconId];
  return <span className="api-integration-badge employee-department-badge" title={department?.name || name} style={{ background: palette.background, color: palette.color }}>{Icon && <Icon size={14} stroke={1.7} aria-hidden="true" />}<span>{department?.name || name}</span></span>;
}

export function DepartmentDialog({ close, onCreate, department }) {
  const [name, setName] = useState(department?.name || '');
  const [colorId, setColorId] = useState(department?.colorId || 'gray');
  const [iconId, setIconId] = useState(department?.iconId || 'folder');
  const [error, setError] = useState('');
  const submit = (event) => {
    event.preventDefault();
    try { onCreate(name, colorId, iconId); } catch (cause) { setError(cause.message); }
  };
  return <ApiDialog title={department ? 'Редактирование отдела' : 'Создание отдела'} closeLabel="Закрыть окно отдела" close={close} className="api-create-dialog department-create-dialog">
    <form className="api-create-form" onSubmit={submit}>
      <label className="api-record-name">Название отдела<input autoFocus value={name} maxLength={80} required placeholder="Например, отдел продаж" onChange={(event) => { setName(event.target.value); setError(''); }} /></label>
      <fieldset className="department-icon-options"><legend>Иконка отдела</legend><div>
        {DEPARTMENT_ICONS.map((item) => { const Icon = ICONS[item.id]; return <label key={item.id} className="department-icon-option" title={item.label}>
          <input type="radio" name="department-icon" aria-label={item.label} checked={iconId === item.id} onChange={() => setIconId(item.id)} />
          <span><Icon size={20} stroke={1.7} aria-hidden="true" /></span>
        </label>; })}
      </div></fieldset>
      <fieldset className="department-color-options"><legend>Цвет бейджа</legend><div>
        {DEPARTMENT_COLORS.map((palette) => <label key={palette.id} className="department-color-option" title={palette.label}>
          <input type="radio" name="department-color" aria-label={palette.label} value={palette.id} checked={colorId === palette.id} onChange={() => setColorId(palette.id)} />
          <span style={{ background: palette.background, color: palette.color }}><IconCheck size={17} stroke={2} aria-hidden="true" /></span>
        </label>)}
      </div></fieldset>
      <div className="api-badge-preview"><span>Предпросмотр</span><DepartmentBadge department={{ name: name.trim() || 'Название отдела', colorId, iconId }} /></div>
      {error && <p className="api-record-error" role="alert">{error}</p>}
      <footer><button className="light-button" type="button" onClick={close}>Отменить</button><button className="dark-button" type="submit">{department ? 'Применить' : 'Создать отдел'}</button></footer>
    </form>
  </ApiDialog>;
}
