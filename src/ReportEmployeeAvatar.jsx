import { useState } from 'react';
import anna from './assets/avatars/employee-1.webp';
import mikhail from './assets/avatars/employee-2.webp';
import elena from './assets/avatars/employee-3.webp';
import alexey from './assets/avatars/employee-4.webp';
import maria from './assets/avatars/employee-5.webp';
import ivan from './assets/avatars/employee-6.webp';
import './report-employee-avatar.css';

// Existing demo portraits, assigned consistently across the fictional report fixtures.
const demoPortraits = {
  'Смирнова Анна Викторовна': anna,
  'Волков Михаил Сергеевич': mikhail,
  'Кузнецова Елена Павловна': elena,
  'Соколов Алексей Андреевич': alexey,
  'Орлова Мария Александровна': maria,
  'Попов Иван Сергеевич': ivan,
};

export function ReportEmployeeAvatar({ name = '', src = demoPortraits[name] }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('ru') || '—';
  return <span className="report-employee-avatar" aria-hidden="true">
    {src && src !== failedSrc
      ? <img src={src} alt="" width={24} height={24} decoding="async" onError={() => setFailedSrc(src)} />
      : initials}
  </span>;
}
