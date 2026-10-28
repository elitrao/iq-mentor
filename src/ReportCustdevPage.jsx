import { useEffect, useState } from 'react';
import { Sidebar } from './App.jsx';
import { SummaryReportPage } from './SummaryReportPage.jsx';
import { CategoryReportPage } from './CategoryReportPage.jsx';
import { REPORT_CUSTDEV_PAGES, reportCustdevRoute } from './report-custdev-navigation.js';
import './report-custdev.css';

export function ReportCustdevPage() {
  const [page, setPage] = useState(() => reportCustdevRoute(window.location.hash));
  const [employee, setEmployee] = useState('');
  const [notice, setNotice] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarPreviewOpen, setSidebarPreviewOpen] = useState(false);
  useEffect(() => {
    const sync = () => {
      const next = reportCustdevRoute(window.location.hash);
      if (window.location.hash && window.location.hash !== `#${next}`) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${next}`);
      setPage(next);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 3500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => { document.title = `${REPORT_CUSTDEV_PAGES.find(item => item.id === page).label} · IQ Mentor`; }, [page]);

  return <div className={`app-shell analyst-shell report-custdev${collapsed && !sidebarPreviewOpen ? ' sidebar-collapsed' : ''}`}>
    <Sidebar page={page} setPage={destination => { setEmployee(''); window.location.hash = reportCustdevRoute(destination); }}
      collapsed={collapsed && !sidebarPreviewOpen} compactMode={collapsed} onPreviewChange={setSidebarPreviewOpen}
      setCollapsed={value => { setSidebarPreviewOpen(false); setCollapsed(value); }} navOrder={['analytics']} reportOnly />
    <div className="app-column">
    <header className="topbar">
      <span className="topbar-page">{REPORT_CUSTDEV_PAGES.find(item => item.id === page).label}</span>
      <div className="mentor-brand"><img src="/iq-logo.svg" alt="IQ" /><span /><em>Аналитик</em></div>
    </header>
    <main className="page-area report-custdev-content">
      {page === 'summary-report'
        ? <SummaryReportPage initialEmployee={employee} notify={setNotice} reportOnly />
        : <CategoryReportPage notify={setNotice} openEmployee={name => { setEmployee(name); window.location.hash = 'summary-report'; }} />}
    </main>
    </div>
    {notice && <div className="toast" role="status">{notice}</div>}
  </div>;
}
