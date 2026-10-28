export const REPORT_CUSTDEV_PAGES = [
  { id: 'summary-report', label: 'Сводный отчёт' },
  { id: 'category-report', label: 'Отчёт по категориям' },
];

export function isReportCustdevPath(pathname) {
  return /^\/reportcustdev\/?$/.test(pathname);
}

export function reportCustdevRoute(hash) {
  const id = hash.replace(/^#/, '');
  return REPORT_CUSTDEV_PAGES.some(page => page.id === id) ? id : 'summary-report';
}
