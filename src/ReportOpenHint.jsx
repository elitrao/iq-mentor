import { IconLayoutSidebarRight } from '@tabler/icons-react';
import './report-open-hint.css';

export function ReportOpenHint({ className = '' }) {
  return <span className={`report-open-hint ${className}`} aria-hidden="true">
    <IconLayoutSidebarRight size={16} stroke={1.6} />
    <span>Открыть</span>
  </span>;
}
