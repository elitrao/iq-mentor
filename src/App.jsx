import { useEffect, useRef, useState } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import bitrix24Logo from "./assets/integrations/bitrix24.png";
import amoCrmLogo from "./assets/integrations/amocrm.png";
import yandexDiskLogo from "./assets/integrations/yandex-disk.png";
import avatar1 from "./assets/avatars/employee-1.webp";
import avatar2 from "./assets/avatars/employee-2.webp";
import avatar3 from "./assets/avatars/employee-3.webp";
import avatar4 from "./assets/avatars/employee-4.webp";
import avatar5 from "./assets/avatars/employee-5.webp";
import avatar6 from "./assets/avatars/employee-6.webp";
import {
  IconAdjustmentsHorizontal, IconArrowDown, IconArrowUp, IconBell, IconBook2, IconBuilding, IconCheck, IconClock,
  IconChevronDown, IconChevronRight, IconCirclePlus, IconCopy, IconCrown, IconDeviceFloppy, IconFile,
  IconDotsVertical, IconFileText, IconFolder, IconHeadphones, IconHome, IconInfoCircle, IconKey, IconLock,
  IconChartDonut, IconGripVertical, IconLayoutGridAdd, IconMenu2, IconPlus, IconPlugConnected, IconReportAnalytics, IconSearch, IconSettings,
  IconPhoneCall, IconShieldCheck, IconSchool, IconSparkles, IconStar, IconSwitchHorizontal, IconTargetArrow, IconTemplate, IconUpload,
  IconUser, IconUsers, IconX,
} from "@tabler/icons-react";

const PAGE_LABELS = { home: "Главная", analytics: "Аналитик", templates: "Шаблоны", trainer: "Тренер", settings: "Настройки" };
const NAV_ITEMS = [
  { id: "home", label: "Главная", icon: IconHome },
  { id: "analytics", label: "Аналитик", icon: IconBook2, arrow: true },
  { id: "templates", label: "Шаблоны", icon: IconFolder },
  { id: "trainer", label: "Тренер", icon: IconSchool, arrow: true },
  { id: "settings", label: "Настройки", icon: IconSettings, arrow: true },
];
const DEFAULT_NAV_ORDER = NAV_ITEMS.map((item) => item.id);
const DEFAULT_DASHBOARD_ORDER = ["calls", "duration", "score", "conversion", "trend", "distribution", "categories", "employees", "attention"];
const CATALOG_WIDGET_IDS = ["catalog-kpi", "catalog-line", "catalog-column", "catalog-donut", "catalog-table", "catalog-map", "catalog-funnel", "catalog-gauge", "catalog-heatmap", "catalog-combo", "catalog-top", "catalog-calendar"];
const ALL_DASHBOARD_WIDGET_IDS = [...DEFAULT_DASHBOARD_ORDER, ...CATALOG_WIDGET_IDS];
const DASHBOARD_SLOTS = [
  { kind: "compact", column: "1 / span 3", row: "1" },
  { kind: "compact", column: "4 / span 3", row: "1" },
  { kind: "compact", column: "7 / span 3", row: "1" },
  { kind: "compact", column: "10 / span 3", row: "1" },
  { kind: "wide", column: "1 / span 7", row: "2" },
  { kind: "medium", column: "8 / span 5", row: "2" },
  { kind: "summary", column: "1 / span 4", row: "3" },
  { kind: "summary", column: "5 / span 4", row: "3" },
  { kind: "summary", column: "9 / span 4", row: "3" },
];

const SETTINGS_GROUPS = [
  { title: "Общие", items: [
    { id: "documents", label: "Документы", icon: IconFileText },
    { id: "employees", label: "Сотрудники", icon: IconUsers },
  ] },
  { title: "Аналитик", items: [
    { id: "analyst-notifications", label: "Настройка уведомлений", icon: IconBell },
    { id: "integrations", label: "Интеграции", icon: IconPlugConnected },
    { id: "analyst-reports", label: "Автогенерация отчетов", icon: IconReportAnalytics },
    { id: "stereo", label: "Стереоформат звонков", icon: IconHeadphones },
    { id: "scoring", label: "Настройка оценки", icon: IconAdjustmentsHorizontal },
  ] },
  { title: "Тренер", items: [
    { id: "trainer-notifications", label: "Настройка уведомлений", icon: IconBell },
    { id: "trainer-reports", label: "Автогенерация отчетов", icon: IconReportAnalytics },
  ] },
];

const DEFAULT_SETTINGS = {
  profile: { name: "Самойленко Даниил", email: "weaver@yandex.ru", phone: "", position: "Руководитель отдела продаж" },
  company: { name: "IQ Group", inn: "", industry: "IT и телеком", timezone: "Europe/Samara" },
  security: { twoFactor: true, sessions: true },
  access: {
    manager: { calls: true, reports: true, employees: false, settings: false },
    analyst: { calls: true, reports: true, employees: true, settings: false },
    admin: { calls: true, reports: true, employees: true, settings: true },
  },
  notifications: {
    analyst: { completed: true, errors: true, weekly: true, browser: false, channel: "Email" },
    trainer: { recommendations: true, progress: true, weekly: false, browser: true, channel: "Email" },
  },
  integrations: {
    bitrix: { connected: true, account: "iqgroup.bitrix24.ru" },
    amo: { connected: false, account: "" },
    yandex: { connected: false, account: "" },
  },
  reports: {
    analyst: { enabled: true, frequency: "Еженедельно", day: "Понедельник", time: "09:00", format: "PDF", recipient: "weaver@yandex.ru" },
    trainer: { enabled: false, frequency: "Ежемесячно", day: "1 число", time: "10:00", format: "PDF", recipient: "weaver@yandex.ru" },
  },
  stereo: { mode: "Автоматически", left: "Сотрудник", right: "Клиент" },
  scoring: { politeness: 30, success: 30, needs: 20, presentation: 20, strict: true, minDuration: "00:00:30", autoAnalyze: false },
};

function loadSettings() {
  try { return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("iq-mentor-settings") || "{}") }; }
  catch { return DEFAULT_SETTINGS; }
}

function loadNavOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem("iq-mentor-nav-order") || "[]");
    const valid = [...new Set(saved.filter((id) => DEFAULT_NAV_ORDER.includes(id)))];
    if (!valid.includes("trainer")) {
      const settingsIndex = valid.indexOf("settings");
      valid.splice(settingsIndex < 0 ? valid.length : settingsIndex, 0, "trainer");
    }
    return [...new Set([...valid, ...DEFAULT_NAV_ORDER])];
  } catch { return DEFAULT_NAV_ORDER; }
}

function loadDashboardOrder() {
  try {
    const saved = JSON.parse(localStorage.getItem("iq-mentor-dashboard-order") || "[]");
    const savedOrder = Array.isArray(saved) ? saved : [...(saved.metrics || []), ...(saved.charts || []), ...(saved.summaries || [])];
    const valid = [...new Set(savedOrder.filter((id) => DEFAULT_DASHBOARD_ORDER.includes(id)))];
    return [...valid, ...DEFAULT_DASHBOARD_ORDER.filter((id) => !valid.includes(id))];
  } catch { return DEFAULT_DASHBOARD_ORDER; }
}

function loadHiddenWidgets() {
  try {
    const saved = JSON.parse(localStorage.getItem("iq-mentor-hidden-widgets") || "[]");
    return [...new Set((Array.isArray(saved) ? saved : []).filter((id) => ALL_DASHBOARD_WIDGET_IDS.includes(id)))];
  } catch { return []; }
}

function loadDashboardLayout() {
  const hidden = loadHiddenWidgets();
  try {
    const saved = JSON.parse(localStorage.getItem("iq-mentor-dashboard-layout-v2") || "null");
    if (Array.isArray(saved) && saved.length === DASHBOARD_SLOTS.length) {
      const used = new Set();
      const layout = saved.map((id) => {
        if (id === null || hidden.includes(id) || !ALL_DASHBOARD_WIDGET_IDS.includes(id) || used.has(id)) return null;
        used.add(id); return id;
      });
      DEFAULT_DASHBOARD_ORDER.filter((id) => !hidden.includes(id) && !used.has(id)).forEach((id) => {
        const emptyIndex = layout.indexOf(null);
        if (emptyIndex >= 0) { layout[emptyIndex] = id; used.add(id); }
      });
      return layout;
    }
  } catch { /* Fall through to the legacy layout migration. */ }
  const visible = loadDashboardOrder().filter((id) => !hidden.includes(id));
  return [...visible, ...Array(DASHBOARD_SLOTS.length - visible.length).fill(null)];
}

export function App() {
  const [page, setPage] = useState(() => { const route = window.location.hash.replace("#", ""); return ["documents", "employees"].includes(route) ? "settings" : route || "settings"; });
  const [collapsed, setCollapsed] = useState(false);
  const [settings, setSettings] = useState(loadSettings);
  const [navOrder, setNavOrder] = useState(loadNavOrder);
  const [toast, setToast] = useState("");
  const [settingSection, setSettingSection] = useState(() => window.location.hash === "#employees" ? "employees" : "documents");

  useEffect(() => { window.location.hash = page; }, [page]);
  useEffect(() => { localStorage.setItem("iq-mentor-settings", JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem("iq-mentor-nav-order", JSON.stringify(navOrder)); }, [navOrder]);
  useEffect(() => {
    const available = SETTINGS_GROUPS.some((group) => group.items.some((item) => item.id === settingSection));
    if (!available) setSettingSection(SETTINGS_GROUPS[0].items[0].id);
  }, [settingSection]);
  useEffect(() => {
    if (!toast) return undefined;
    const timeout = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const notify = (message) => setToast(message);
  const update = (recipe) => setSettings((current) => { const next = structuredClone(current); recipe(next); return next; });
  const reorderNavItem = (id, targetIndex) => {
    setNavOrder((current) => {
      const from = current.indexOf(id);
      if (from < 0 || targetIndex < 0 || targetIndex >= current.length || from === targetIndex) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    notify("Порядок разделов сохранен");
  };

  return <div className={collapsed ? "app-shell sidebar-collapsed" : "app-shell"}>
    <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} navOrder={navOrder} reorderNavItem={reorderNavItem} />
    <div className="app-column">
      <Topbar page={page} setPage={setPage} />
      <main className="page-area">
        {page === "home" && <HomePage setPage={setPage} notify={notify} />}
        {page === "analytics" && <AnalyticsPage notify={notify} />}
        {page === "templates" && <TemplatesPage notify={notify} />}
        {page === "trainer" && <TrainerPage />}
        {page === "settings" && <SettingsPage active={settingSection} setActive={setSettingSection} settings={settings} update={update} notify={notify} />}
      </main>
    </div>
    {toast && <div className="toast"><IconCheck size={18} />{toast}</div>}
  </div>;
}

function Sidebar({ page, setPage, collapsed, setCollapsed, navOrder, reorderNavItem }) {
  const navRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [drag, setDrag] = useState(null);
  const orderedItems = navOrder.map((id) => NAV_ITEMS.find((item) => item.id === id)).filter(Boolean);

  const updateDrag = (next) => { dragRef.current = next; setDrag(next); };
  const startDrag = (event, item, index) => {
    if (event.button !== 0 || collapsed || window.matchMedia("(max-width: 767px)").matches) return;
    const navRect = navRef.current.getBoundingClientRect();
    const rowRect = event.currentTarget.closest(".nav-row").getBoundingClientRect();
    const firstRect = navRef.current.querySelector(".nav-row").getBoundingClientRect();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional; window events still bubble during ordinary dragging. */ }
    updateDrag({
      id: item.id,
      pointerId: event.pointerId,
      sourceIndex: index,
      targetIndex: index,
      startY: event.clientY,
      pointerY: event.clientY,
      offsetY: event.clientY - rowRect.top,
      navTop: navRect.top,
      firstTop: firstRect.top,
      width: rowRect.width,
      height: rowRect.height,
      slotHeight: rowRect.height + 2,
      active: false,
    });
  };
  const continueDrag = (event) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const active = current.active || Math.abs(event.clientY - current.startY) > 6;
    const dragTop = event.clientY - current.offsetY;
    const targetIndex = Math.max(0, Math.min(orderedItems.length - 1, Math.round((dragTop - current.firstTop) / current.slotHeight)));
    if (active) event.preventDefault();
    updateDrag({ ...current, pointerY: event.clientY, targetIndex, active });
  };
  const finishDrag = (event, canceled = false) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.active) {
      suppressClickRef.current = true;
      if (!canceled) reorderNavItem(current.id, current.targetIndex);
    }
    updateDrag(null);
  };
  const openPage = (id) => {
    if (suppressClickRef.current) { suppressClickRef.current = false; return; }
    setPage(id);
  };
  const draggedItem = drag?.active ? orderedItems.find((item) => item.id === drag.id) : null;
  return <aside className="sidebar">
    <div className="sidebar-brand">
      <button className="bare-icon crop-button" aria-label="Свернуть меню" onClick={() => setCollapsed(!collapsed)}><IconMenu2 size={18} stroke={1.6} /></button>
      <img src="/iq-logo.svg" className="brand-logo" alt="IQ" />
      <span className="sidebar-product">Ментор</span>
    </div>
    <nav ref={navRef} className={drag?.active ? "sidebar-nav is-reordering" : "sidebar-nav"} aria-label="Основная навигация">
      {orderedItems.map((item, index) => {
        const Icon = item.icon;
        const shift = !drag?.active || index === drag.sourceIndex ? 0 : drag.sourceIndex < drag.targetIndex && index > drag.sourceIndex && index <= drag.targetIndex ? -drag.slotHeight : drag.sourceIndex > drag.targetIndex && index >= drag.targetIndex && index < drag.sourceIndex ? drag.slotHeight : 0;
        return <div className={drag?.active && item.id === drag.id ? "nav-row drag-origin" : "nav-row"} style={{ transform: `translateY(${shift}px)` }} key={item.id}>
          <button className={page === item.id ? "nav-item active" : "nav-item"} onClick={() => openPage(item.id)} onPointerDown={(event) => startDrag(event, item, index)} onPointerMove={continueDrag} onPointerUp={finishDrag} onPointerCancel={(event) => finishDrag(event, true)} aria-describedby={`nav-drag-hint-${item.id}`}>
            <Icon size={18} stroke={1.7} />
            <span>{item.label}</span>
            {item.arrow && <IconChevronRight className="nav-arrow" size={18} stroke={1.5} />}
          </button>
          <span className="nav-drag-hint" id={`nav-drag-hint-${item.id}`} role="tooltip">Зажмите, чтобы переместить</span>
        </div>;
      })}
      {drag?.active && <span className="nav-drop-slot" style={{ top: `${drag.firstTop - drag.navTop + drag.targetIndex * drag.slotHeight}px`, height: `${drag.height}px` }} aria-hidden="true" />}
      {draggedItem && <NavDragOverlay item={draggedItem} active={page === draggedItem.id} top={drag.pointerY - drag.navTop - drag.offsetY} width={drag.width} />}
    </nav>
    <div className="sidebar-bottom">
      <button className="nav-item muted-item"><IconInfoCircle size={18} stroke={1.7} /><span>База знаний</span></button>
      <button className="nav-item muted-item"><IconHeadphones size={18} stroke={1.7} /><span>Поддержка</span></button>
      <div className="profile-card"><span className="avatar">СД</span><span className="profile-copy"><strong>Самойленко Даниил</strong><small>weaver@yandex.ru</small></span></div>
      <button className="lk-button">Перейти в ЛК <IconSwitchHorizontal size={19} /></button>
    </div>
  </aside>;
}

function NavDragOverlay({ item, active, top, width }) {
  const Icon = item.icon;
  return <div className="nav-drag-overlay" style={{ top: `${top}px`, width: `${width}px` }} aria-hidden="true">
    <div className={active ? "nav-item active" : "nav-item"}>
      <Icon size={18} stroke={1.7} />
      <span>{item.label}</span>
      {item.arrow && <IconChevronRight className="nav-arrow" size={18} stroke={1.5} />}
    </div>
  </div>;
}

function Topbar({ page, setPage }) {
  if (page === "home") return null;
  return <header className="topbar">
    <span className="topbar-page">{PAGE_LABELS[page]}</span>
    <button className="mentor-brand" onClick={() => setPage("home")}><img src="/iq-logo.svg" alt="IQ" /><span></span><em>Ментор</em></button>
    <div className="topbar-actions"><div className="balance">Баланс <strong>990 / 500</strong></div><button className="header-icon" aria-label="Уведомления"><IconBell size={21} stroke={1.5} /></button><button className="header-icon" aria-label="Поддержка"><IconHeadphones size={21} stroke={1.5} /></button><button className="lk-small">в ЛК <IconSwitchHorizontal size={18} /></button></div>
  </header>;
}

function PageTitle({ children, badge }) { return <div className="page-title"><h1>{children}</h1>{badge && <span>{badge}</span>}</div>; }

function WidgetCatalogPreview({ item }) {
  const Icon = item.catalogIcon;
  const kind = item.previewKind || item.id;
  if (kind === "home-kpi") return <div className={`widget-preview widget-reference-home-kpi ${item.tone}`} aria-hidden="true"><div><strong>{item.value}{item.suffix && <em>{item.suffix}</em>}</strong><svg viewBox="0 0 120 42" preserveAspectRatio="none"><polyline points="2,35 18,27 32,30 47,18 62,25 77,11 93,19 108,4 118,8" /></svg></div><footer><span><IconArrowUp size={10} />{item.delta}</span><b>{item.badge} <IconArrowUp size={9} /></b></footer></div>;
  if (kind === "kpi") return <div className="widget-preview widget-reference-kpi" aria-hidden="true"><div><strong>{item.value || "1 250"}{item.suffix && <em>{item.suffix}</em>}</strong><span><IconArrowUp size={10} />{item.badge || "12.5%"}</span></div><small>{item.delta ? `${item.delta} относительно периода` : "vs прошлый период"}</small><svg viewBox="0 0 220 55" preserveAspectRatio="none"><polyline points="3,46 20,38 36,43 55,31 72,38 91,26 110,31 130,18 150,22 172,10 192,15 216,4" /></svg></div>;
  if (kind === "line") return <div className="widget-preview widget-reference-line" aria-hidden="true"><span>100</span><span>50</span><span>0</span><svg viewBox="0 0 220 90" preserveAspectRatio="none"><polyline className="muted" points="4,66 28,28 54,55 82,44 108,61 139,32 169,54 194,43 216,48"/><polyline points="4,62 28,48 54,25 82,50 108,39 139,17 169,31 194,9 216,12"/></svg><div>{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((day) => <i key={day}>{day}</i>)}</div></div>;
  if (kind === "column") return <div className="widget-preview widget-reference-column" aria-hidden="true"><span>100</span><span>50</span><span>0</span><div>{[52,31,48,70,55,38,66].map((value,index) => <i key={index} style={{ height: `${value}%` }}><small>{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"][index]}</small></i>)}</div></div>;
  if (kind === "donut") return <div className="widget-preview widget-reference-donut" aria-hidden="true"><div className="widget-reference-donut-ring"></div><ul><li><i></i>Прямой <b>40%</b></li><li><i></i>Органический <b>25%</b></li><li><i></i>Реферальный <b>20%</b></li><li><i></i>Почта <b>15%</b></li></ul></div>;
  if (kind === "table") return <div className="widget-preview widget-reference-table" aria-hidden="true"><div><b>Название</b><b>Статус</b><b>Сумма</b></div>{[["Продукт A","Активен","12 540 ₽"],["Продукт B","Ожидает","8 200 ₽"],["Продукт C","Завершен","17 800 ₽"]].map((row) => <div key={row[0]}>{row.map((cell) => <span key={cell}>{cell}</span>)}</div>)}</div>;
  if (kind === "map") return <div className="widget-preview widget-reference-map" aria-hidden="true"><svg viewBox="0 0 260 120"><path d="M11 37l21-18 32 5 12 18-16 12-22-8-8 17-18-7zm75 0 25-11 21 9 7 18-17 12-5 30-17-3-6-25-13-13zm61-15 34-11 43 9 28 27-18 16-24-5-10 21-22 19-19-13 6-22-17-13z"/><circle cx="43" cy="53" r="7"/><circle cx="126" cy="62" r="5"/><circle cx="222" cy="64" r="7"/><circle cx="176" cy="45" r="4"/></svg></div>;
  if (kind === "funnel") return <div className="widget-preview widget-reference-funnel" aria-hidden="true"><div><i></i><i></i><i></i><i></i></div><ul><li>Просмотры <b>12 500</b></li><li>Клики <b>5 300</b></li><li>Лиды <b>1 250</b></li><li>Продажи <b>320</b></li></ul></div>;
  if (kind === "gauge") return <div className="widget-preview widget-reference-gauge" aria-hidden="true"><div><span>78%</span><small>Цель: 100%</small></div></div>;
  if (kind === "heatmap") return <div className="widget-preview widget-reference-heatmap" aria-hidden="true"><div className="widget-heatmap-days">{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((day) => <span key={day}>{day}</span>)}</div><div className="widget-heatmap-grid">{Array.from({ length: 49 },(_,index) => <i key={index} style={{ opacity: .14 + ((index * 7 + index % 5) % 10) / 11 }}></i>)}</div><div className="widget-heatmap-hours"><span>0:00</span><span>6:00</span><span>12:00</span><span>18:00</span></div></div>;
  if (kind === "combo") return <div className="widget-preview widget-reference-combo" aria-hidden="true"><div>{[45,70,36,58,78,52,88].map((value,index) => <i key={index} style={{ height: `${value}%` }}></i>)}</div><svg viewBox="0 0 220 92" preserveAspectRatio="none"><polyline points="5,54 38,28 71,49 104,20 137,45 170,18 215,4"/></svg><span>100</span><span>50</span><span>0</span></div>;
  if (kind === "top") return <div className="widget-preview widget-reference-top" aria-hidden="true">{[["Категория A",92,"2 540"],["Категория Б",76,"1 870"],["Категория В",61,"1 430"],["Категория Г",48,"980"]].map(([label,value,total]) => <div key={label}><span>{label}</span><i><b style={{ width: `${value}%` }}></b></i><strong>{total}</strong></div>)}</div>;
  if (kind === "calendar") return <div className="widget-preview widget-reference-calendar" aria-hidden="true"><header><span>‹</span><strong>Май 2024</strong><span>›</span></header><div className="widget-calendar-grid">{["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((day) => <b key={day}>{day}</b>)}{Array.from({ length: 35 },(_,index) => <i className={[9,17,25].includes(index) ? "active" : ""} key={index}>{index < 2 ? 29 + index : index - 1}</i>)}</div></div>;
  if (kind === "people") return <div className="widget-preview widget-reference-people" aria-hidden="true"><header><span>Сотрудник</span><span>Оценка</span><span>Звонки</span></header>{[[avatar1,"Анна","100%",16],[avatar2,"Дмитрий","92%",10],[avatar3,"Мария","89%",8]].map(([avatar,name,score,calls]) => <div key={name}><img src={avatar} alt=""/><strong>{name}</strong><span>{score}</span><span>{calls}</span></div>)}</div>;
  if (kind === "attention") return <div className="widget-preview widget-reference-attention" aria-hidden="true">{[[avatar1,"Вежливость","62%"],[avatar3,"Возражения","58%"],[avatar2,"Презентация","52%"]].map(([avatar,issue,score],index) => <div key={issue}><img src={avatar} alt=""/><span className={`tone-${index}`}>{issue}</span><strong>{score}</strong></div>)}</div>;
  if (item.type === "metric") return <div className={`widget-preview widget-preview-metric ${item.tone}`} aria-hidden="true"><div><span><Icon size={16} stroke={1.9} /></span><small>{item.label}</small></div><strong>{item.value}<em>{item.suffix}</em></strong><svg viewBox="0 0 120 34" preserveAspectRatio="none"><polyline points="2,29 18,23 32,25 47,15 62,21 77,9 93,16 108,4 118,8" /></svg></div>;
  if (item.id === "trend") return <div className="widget-preview widget-preview-trend" aria-hidden="true"><span>100%</span><span>50%</span><span>0%</span><svg viewBox="0 0 240 92" preserveAspectRatio="none"><defs><linearGradient id="catalog-trend-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#20b76f" stopOpacity=".28"/><stop offset="1" stopColor="#20b76f" stopOpacity=".02"/></linearGradient></defs><path d="M4 76 L40 58 L78 30 L116 37 L154 25 L194 20 L236 34 L236 88 L4 88 Z" fill="url(#catalog-trend-fill)"/><polyline points="4,76 40,58 78,30 116,37 154,25 194,20 236,34" /></svg></div>;
  if (item.id === "distribution") return <div className="widget-preview widget-preview-distribution" aria-hidden="true"><div className="widget-preview-donut"><span>2 001<small>звонков</small></span></div><div className="widget-preview-legend"><i></i><i></i><i></i><i></i></div></div>;
  if (item.id === "categories") return <div className="widget-preview widget-preview-bars" aria-hidden="true">{[91, 82, 73, 61].map((value, index) => <div key={value}><span style={{ width: `${value}%`, "--bar-index": index }}></span><small>{value}%</small></div>)}</div>;
  if (item.id === "employees") return <div className="widget-preview widget-preview-people" aria-hidden="true">{[[avatar1, "Анна", "100%"], [avatar2, "Дмитрий", "92%"], [avatar3, "Мария", "89%"]].map(([avatar, name, score]) => <div key={name}><img src={avatar} alt=""/><span>{name}</span><strong>{score}</strong></div>)}</div>;
  return <div className="widget-preview widget-preview-attention" aria-hidden="true">{[[avatar1, "Вежливость", "62%"], [avatar3, "Возражения", "58%"], [avatar2, "Презентация", "52%"]].map(([avatar, issue, score], index) => <div key={issue}><img src={avatar} alt=""/><span className={`tone-${index}`}>{issue}</span><strong>{score}</strong></div>)}</div>;
}

function HomePage({ setPage, notify }) {
  // Dashboard data mirrors the approved IQ Mentor home-page reference.
  const stats = [
    { id: "calls", label: "Обработано звонков", value: "2 001", delta: "1 250 за период", badge: "166%", icon: IconPhoneCall, tone: "green", sparkColor: "#85b91d", spark: [18, 22, 20, 27, 35, 28, 40, 53, 51, 66] },
    { id: "duration", label: "Длительность звонков", value: "10 208", suffix: "мин", delta: "7 417 за период", badge: "266%", icon: IconClock, tone: "violet", sparkColor: "#7867e7", spark: [28, 45, 40, 54, 58, 40, 38, 65] },
    { id: "score", label: "Средняя оценка", value: "84%", delta: "6% за период", badge: "6%", icon: IconStar, tone: "blue", sparkColor: "#3e82dc", spark: [22, 29, 25, 39, 54, 42, 45, 67, 52, 75] },
    { id: "conversion", label: "Конверсия в сделку", value: "32%", delta: "5% за период", badge: "5%", icon: IconTargetArrow, tone: "orange", sparkColor: "#e86f48", spark: [29, 39, 33, 51, 37, 52, 68, 62] },
  ];
  const categories = [
    ["Вежливость", 91, 5, "#11ad68"], ["Выявление потребностей", 88, 3, "#19a6a4"],
    ["Презентация продукта", 85, 2, "#178fbc"], ["Работа с возражениями", 78, -2, "#7057ef"],
    ["Завершение сделки", 72, -4, "#8b39ef"],
  ];
  const employees = [
    [avatar1, "Кузнецова Анна", "100%", 16], [avatar3, "Потапова Мария", "98%", 13],
    [avatar2, "Федоров Дмитрий", "92%", 10], [avatar5, "Возакова Нина", "89%", 8], [avatar6, "Мальцев Дмитрий", "85%", 7],
  ];
  const attention = [
    [avatar1, "Иванов Сергей", "Низкая вежливость", "62%", "coral"], [avatar3, "Петрова Ольга", "Возражения", "58%", "amber"],
    [avatar2, "Романов Олег", "Презентация продукта", "52%", "violet"], [avatar6, "Сидоров Алексей", "Закрытие сделки", "45%", "amber"],
    [avatar5, "Смирнова Елена", "Работа с возражениями", "42%", "violet"],
  ];
  const [dashboardLayout, setDashboardLayout] = useState(loadDashboardLayout);
  const [hiddenWidgets, setHiddenWidgets] = useState(loadHiddenWidgets);
  const [customizing, setCustomizing] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState("");
  const [catalogFilter, setCatalogFilter] = useState("all");
  useEffect(() => { localStorage.setItem("iq-mentor-dashboard-layout-v2", JSON.stringify(dashboardLayout)); }, [dashboardLayout]);
  useEffect(() => { localStorage.setItem("iq-mentor-hidden-widgets", JSON.stringify(hiddenWidgets)); }, [hiddenWidgets]);
  useEffect(() => {
    if (!catalogOpen) return undefined;
    const closeCatalog = (event) => { if (event.key === "Escape") setCatalogOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeCatalog);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeCatalog);
    };
  }, [catalogOpen]);
  const reorderDashboard = (id, targetIndex) => {
    setDashboardLayout((current) => {
      const sourceIndex = current.indexOf(id);
      if (sourceIndex < 0 || sourceIndex === targetIndex) return current;
      const next = [...current];
      if (next[targetIndex] === null) {
        next[sourceIndex] = null;
        next[targetIndex] = id;
        return next;
      }
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    notify("Порядок блоков сохранен");
  };
  const hideWidget = (item) => {
    setHiddenWidgets((current) => current.includes(item.id) ? current : [...current, item.id]);
    setDashboardLayout((current) => {
      const visible = current.filter((id) => id !== null && id !== item.id);
      return [...visible, ...Array(DASHBOARD_SLOTS.length - visible.length).fill(null)];
    });
    notify(`Виджет «${item.label || ({ trend: "Динамика средней оценки", distribution: "Распределение оценок", categories: "Топ категорий", employees: "Топ сотрудники", attention: "Требует внимания" }[item.id])}» скрыт`);
  };
  const addWidget = (item) => {
    setHiddenWidgets((current) => current.filter((id) => id !== item.id));
    setDashboardLayout((current) => {
      if (current.includes(item.id)) return current;
      const next = [...current];
      const emptyIndex = next.indexOf(null);
      if (emptyIndex >= 0) next[emptyIndex] = item.id;
      else {
        const replaced = next[next.length - 1];
        next[next.length - 1] = item.id;
        if (replaced) setHiddenWidgets((hidden) => [...new Set([...hidden.filter((id) => id !== item.id), replaced])]);
      }
      return next;
    });
    notify(`Виджет «${item.label}» добавлен на главную`);
  };
  const chartItems = [{ id: "trend", type: "chart" }, { id: "distribution", type: "chart" }];
  const summaryItems = [{ id: "categories", type: "summary" }, { id: "employees", type: "summary" }, { id: "attention", type: "summary" }];
  const renderMetric = (item) => { const Icon = item.icon; return <article className={`home-kpi ${item.tone}`}><div className="home-kpi-top"><span className="home-kpi-icon"><Icon size={23} stroke={1.8} /></span><strong>{item.label}</strong><button aria-label={`Скрыть виджет: ${item.label}`} title="Скрыть виджет" onClick={() => hideWidget(item)}><IconDotsVertical size={20} /></button></div><div className="home-kpi-main"><div><b>{item.value}</b>{item.suffix && <em>{item.suffix}</em>}</div><Sparkline values={item.spark} color="#fff" /></div><div className="home-kpi-footer"><span><IconArrowUp size={15} />{item.delta}</span><em>{item.badge} <IconArrowUp size={13} /></em></div></article>; };
  const renderChart = (item) => item.id === "trend"
    ? <DashboardPanel title="Динамика средней оценки" className="home-trend-panel" onHide={() => hideWidget(item)} action={<button>По дням <IconChevronDown size={16} /></button>}><DashboardLineChart /></DashboardPanel>
    : <DashboardPanel title="Распределение оценок" className="home-distribution-panel" onHide={() => hideWidget(item)}><div className="home-distribution-body"><DonutChart /><div className="home-distribution-legend">{[["#16ad67", "Отлично (80–100%)", "65%"], ["#f3b400", "Хорошо (60–80%)", "20%"], ["#f2750a", "Удовлетворительно (40–60%)", "10%"], ["#f13b35", "Плохо (0–40%)", "5%"]].map(([color, label, value]) => <div key={label}><i style={{ background: color }}></i><span>{label}</span><strong>{value}</strong></div>)}</div></div></DashboardPanel>;
  const renderSummary = (item) => {
    if (item.id === "categories") return <DashboardPanel title="Топ категорий" onHide={() => hideWidget(item)}><div className="home-category-list">{categories.map(([label, value, delta, color]) => <div className="home-category-item" key={label}><div><span>{label}</span><strong style={{ color }}>{value}%</strong><em className={delta < 0 ? "down" : ""}>{delta < 0 ? <IconArrowDown size={13} /> : <IconArrowUp size={13} />}{Math.abs(delta)}%</em></div><progress max="100" value={value} style={{ "--progress-color": color }} /></div>)}</div><button className="home-panel-link" onClick={() => setPage("analytics")}>Все категории</button></DashboardPanel>;
    if (item.id === "employees") return <DashboardPanel title="Топ сотрудники" onHide={() => hideWidget(item)}><div className="home-employee-head"><span>Сотрудник</span><span>Средняя оценка</span><span>Кол-во звонков</span></div><div className="home-employee-list">{employees.map(([avatar, name, score, calls]) => <div key={name}><img src={avatar} alt="" /><strong>{name}</strong><span>{score}</span><span>{calls}</span></div>)}</div><button className="home-panel-link" onClick={() => { setPage("settings"); notify("Открыт раздел сотрудников"); }}>Все сотрудники</button></DashboardPanel>;
    return <DashboardPanel title="Требует внимания" onHide={() => hideWidget(item)}><div className="home-attention-list">{attention.map(([avatar, name, issue, score, tone]) => <div key={name}><img src={avatar} alt="" /><strong>{name}</strong><span className={tone}>{issue}</span><b>{score}</b></div>)}</div><button className="home-panel-link" onClick={() => setPage("analytics")}>Все вопросы</button></DashboardPanel>;
  };
  const referenceCatalogItems = [
    { id: "catalog-kpi", type: "catalog", previewKind: "kpi", label: "KPI показатели", catalogIcon: IconArrowUp, catalogGroup: "metrics", catalogDescription: "Ключевые показатели с динамикой и сравнением с прошлым периодом." },
    { id: "catalog-line", type: "catalog", previewKind: "line", label: "Линейный график", catalogIcon: IconReportAnalytics, catalogGroup: "analytics", catalogDescription: "Показывает изменение нескольких показателей во времени." },
    { id: "catalog-column", type: "catalog", previewKind: "column", label: "Столбчатая диаграмма", catalogIcon: IconAdjustmentsHorizontal, catalogGroup: "analytics", catalogDescription: "Сравнивает значения между периодами или категориями." },
    { id: "catalog-donut", type: "catalog", previewKind: "donut", label: "Кольцевая диаграмма", catalogIcon: IconChartDonut, catalogGroup: "analytics", catalogDescription: "Показывает доли и проценты в общем объёме." },
    { id: "catalog-table", type: "catalog", previewKind: "table", label: "Таблица данных", catalogIcon: IconTemplate, catalogGroup: "tables", catalogDescription: "Отображает подробные данные в строках и столбцах." },
    { id: "catalog-map", type: "catalog", previewKind: "map", label: "Карта", catalogIcon: IconTargetArrow, catalogGroup: "maps", catalogDescription: "Визуализирует данные по регионам и направлениям." },
    { id: "catalog-funnel", type: "catalog", previewKind: "funnel", label: "Воронка продаж", catalogIcon: IconTargetArrow, catalogGroup: "marketing", catalogDescription: "Показывает этапы конверсии и их эффективность." },
    { id: "catalog-gauge", type: "catalog", previewKind: "gauge", label: "Спидометр", catalogIcon: IconClock, catalogGroup: "metrics", catalogDescription: "Показывает прогресс достижения цели или KPI." },
    { id: "catalog-heatmap", type: "catalog", previewKind: "heatmap", label: "Тепловая карта", catalogIcon: IconLayoutGridAdd, catalogGroup: "operations", catalogDescription: "Показывает активность по дням и времени." },
    { id: "catalog-combo", type: "catalog", previewKind: "combo", label: "Комбинированный график", catalogIcon: IconReportAnalytics, catalogGroup: "analytics", catalogDescription: "Объединяет столбцы и линию для сравнения данных." },
    { id: "catalog-top", type: "catalog", previewKind: "top", label: "Топ по категориям", catalogIcon: IconMenu2, catalogGroup: "operations", catalogDescription: "Ранжирует лучшие категории по выбранному показателю." },
    { id: "catalog-calendar", type: "catalog", previewKind: "calendar", label: "Календарь активности", catalogIcon: IconClock, catalogGroup: "operations", catalogDescription: "Показывает события и активность по календарным дням." },
  ];
  const dashboardItems = [...stats.map((item) => ({ ...item, type: "metric" })), ...chartItems, ...summaryItems, ...referenceCatalogItems];
  const catalogItems = [...referenceCatalogItems, ...dashboardItems.filter((item) => item.type !== "catalog").map((item) => ({
    ...item,
    label: item.label || ({ trend: "Динамика средней оценки", distribution: "Распределение оценок", categories: "Топ категорий", employees: "Топ сотрудники", attention: "Требует внимания" }[item.id]),
    catalogIcon: item.icon || ({ trend: IconReportAnalytics, distribution: IconChartDonut, categories: IconTemplate, employees: IconUsers, attention: IconBell }[item.id]),
    catalogGroup: item.type === "metric" ? "metrics" : item.type === "chart" ? "analytics" : "team",
    previewKind: item.type === "metric" ? "home-kpi" : ({ trend: "line", distribution: "donut", categories: "top", employees: "people", attention: "attention" })[item.id],
    catalogDescription: ({
      calls: "Количество обработанных звонков и динамика за выбранный период.",
      duration: "Общая длительность разговоров и изменение показателя.",
      score: "Средняя оценка качества звонков с динамикой результата.",
      conversion: "Доля звонков, которые завершились созданием сделки.",
      trend: "Показывает, как менялась средняя оценка звонков во времени.",
      distribution: "Показывает доли звонков по диапазонам итоговой оценки.",
      categories: "Сравнивает категории оценки и показывает их динамику.",
      employees: "Рейтинг сотрудников по оценке и количеству звонков.",
      attention: "Сотрудники и навыки, которым сейчас требуется внимание.",
    })[item.id],
  }))];
  const popularWidgetIds = ["catalog-kpi", "catalog-line", "catalog-column", "catalog-donut", "catalog-funnel", "catalog-gauge"];
  const catalogGroupLabels = { metrics: "Показатели", analytics: "Диаграммы", tables: "Таблицы", maps: "Карты", marketing: "Маркетинг", operations: "Операции", team: "Команда" };
  const shownCatalogItems = catalogItems.filter((item) => {
    const inFilter = catalogFilter === "all" || (catalogFilter === "popular" ? popularWidgetIds.includes(item.id) : item.catalogGroup === catalogFilter);
    return inFilter && item.label.toLowerCase().includes(catalogQuery.trim().toLowerCase());
  });
  const renderDashboardItem = (item) => item.type === "metric" ? renderMetric(item) : item.type === "chart" ? renderChart(item) : item.type === "catalog" ? <DashboardPanel title={item.label} className="home-catalog-widget" onHide={() => hideWidget(item)}><div className="home-catalog-widget-body"><WidgetCatalogPreview item={item} /></div></DashboardPanel> : renderSummary(item);
  return <section className="home-dashboard">
    <header className="home-dashboard-header"><h1>Главная</h1><div className="home-header-controls">{customizing ? <><span className="home-customize-status"><IconGripVertical size={16} />Перетаскивайте виджеты</span><button className="home-catalog-button" onClick={() => setCatalogOpen(true)}><IconLayoutGridAdd size={17} />Каталог</button><button className="home-customize-done" onClick={() => { setCustomizing(false); setCatalogOpen(false); }}>Готово</button></> : <button className="home-catalog-button" onClick={() => setCustomizing(true)}><IconLayoutGridAdd size={17} />Настроить главную</button>}{hiddenWidgets.length > 0 && <button className="home-restore-widgets" onClick={() => { setDashboardLayout((current) => { const restored = [...current]; hiddenWidgets.forEach((id) => { const emptyIndex = restored.indexOf(null); if (emptyIndex >= 0) restored[emptyIndex] = id; }); return restored; }); setHiddenWidgets([]); notify("Все виджеты возвращены"); }}>Вернуть скрытые <span>{hiddenWidgets.length}</span></button>}<div className="home-balance">Баланс <strong>1204 672 / 5 000</strong></div><button className="header-icon home-notification" aria-label="Уведомления"><IconBell size={20} /><i>8</i></button><button className="header-icon" aria-label="Поддержка"><IconHeadphones size={20} /></button><button className="lk-small">в ЛК <IconSwitchHorizontal size={17} /></button></div></header>
    <ReorderableDashboardGrid className="home-unified-grid" items={dashboardItems} order={dashboardLayout} slots={DASHBOARD_SLOTS} renderItem={renderDashboardItem} onReorder={reorderDashboard} editing={customizing} onOpenCatalog={() => { setCustomizing(true); setCatalogOpen(true); }} />
    {catalogOpen && <div className="widget-catalog-layer"><button className="widget-catalog-backdrop" aria-label="Закрыть каталог" onClick={() => setCatalogOpen(false)}></button><section className="widget-catalog" role="dialog" aria-modal="true" aria-labelledby="widget-catalog-title">
      <header className="widget-catalog-header"><div className="widget-catalog-heading"><h2 id="widget-catalog-title">Каталог виджетов</h2><p>Готовые виджеты для аналитики звонков и работы с командой</p></div><div className="widget-catalog-toolbar"><label className="widget-catalog-search"><IconSearch size={17} /><input value={catalogQuery} onChange={(event) => setCatalogQuery(event.target.value)} placeholder="Поиск виджетов..." autoFocus /></label><button className="widget-catalog-close" aria-label="Закрыть каталог" onClick={() => setCatalogOpen(false)}><IconX size={22} /></button></div></header>
      <div className="widget-catalog-filters">{[["all", "Все виджеты"], ["popular", "Популярные"], ["analytics", "Диаграммы"], ["metrics", "Показатели"], ["tables", "Таблицы"], ["maps", "Карты"], ["marketing", "Маркетинг"], ["operations", "Операции"], ["team", "Команда"]].map(([id, label]) => <button className={catalogFilter === id ? "active" : ""} onClick={() => setCatalogFilter(id)} key={id}>{label}</button>)}</div>
      <div className="widget-catalog-list">{shownCatalogItems.map((item) => { const visible = dashboardLayout.includes(item.id); const CatalogIcon = item.catalogIcon; return <article key={item.id}><header><span><CatalogIcon size={16} /></span><strong>{item.label}</strong></header><WidgetCatalogPreview item={item}/><p>{item.catalogDescription}</p><footer><span className={`widget-category-tag ${item.catalogGroup}`}>{catalogGroupLabels[item.catalogGroup]}</span><button className={visible ? "visible" : "add"} aria-label={visible ? `Убрать виджет ${item.label}` : `Добавить виджет ${item.label}`} title={visible ? "Убрать с главной" : "Добавить на главную"} onClick={() => visible ? hideWidget(item) : addWidget(item)}>{visible ? <><IconCheck size={15} /><span>На главной</span></> : <><IconPlus size={15} /><span>Добавить</span></>}</button></footer></article>; })}{shownCatalogItems.length === 0 && <div className="widget-catalog-empty">По вашему запросу ничего не найдено</div>}</div>
      <footer className="widget-catalog-bottom"><div><span><IconSparkles size={20} /></span><p><strong>Не нашли нужный виджет?</strong><small>Предложите идею или запросите новый виджет.</small></p></div><div>{hiddenWidgets.length > 0 && <button className="widget-restore-all" onClick={() => { hiddenWidgets.forEach((id) => { const item = catalogItems.find((catalogItem) => catalogItem.id === id); if (item) addWidget(item); }); }}>Вернуть все скрытые</button>}<button className="widget-request-button" onClick={() => notify("Запрос на новый виджет отправлен")}><IconFileText size={16} />Запросить виджет</button><button className="widget-create-button" onClick={() => notify("Конструктор пользовательских виджетов скоро появится")}><IconPlus size={17} />Создать свой виджет</button></div></footer>
    </section></div>}
  </section>;
}

function ReorderableDashboardGrid({ className, items, order, slots, renderItem, onReorder, editing, onOpenCatalog }) {
  const gridRef = useRef(null);
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [drag, setDrag] = useState(null);
  const orderedItems = order.map((id) => id === null ? null : items.find((item) => item.id === id) || null);
  const updateDrag = (next) => { dragRef.current = next; setDrag(next); };
  const startDrag = (event, item, sourceIndex) => {
    if (!editing || event.button !== 0 || window.matchMedia("(max-width: 820px)").matches || event.target.closest("button, a, input, select, textarea")) return;
    const gridRect = gridRef.current.getBoundingClientRect();
    const rects = orderedItems.map((_, index) => gridRef.current.querySelector(`[data-dashboard-slot="${index}"]`).getBoundingClientRect());
    const cellRect = event.currentTarget.getBoundingClientRect();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Pointer capture is optional. */ }
    updateDrag({ id: item.id, pointerId: event.pointerId, sourceIndex, targetIndex: sourceIndex, startX: event.clientX, startY: event.clientY, pointerX: event.clientX, pointerY: event.clientY, offsetRatioX: (event.clientX - cellRect.left) / cellRect.width, offsetRatioY: (event.clientY - cellRect.top) / cellRect.height, gridLeft: gridRect.left, gridTop: gridRect.top, width: cellRect.width, height: cellRect.height, rects, active: false });
  };
  const continueDrag = (event) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);
    const active = current.active || distance > 6;
    let targetIndex = current.targetIndex;
    if (active) {
      event.preventDefault();
      targetIndex = current.rects.reduce((closest, rect, index) => {
        const distanceToSlot = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
        return distanceToSlot < closest.distance ? { index, distance: distanceToSlot } : closest;
      }, { index: current.sourceIndex, distance: Number.POSITIVE_INFINITY }).index;
    }
    updateDrag({ ...current, pointerX: event.clientX, pointerY: event.clientY, targetIndex, active });
  };
  const finishDrag = (event, canceled = false) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.active) {
      suppressClickRef.current = true;
      if (!canceled && current.sourceIndex !== current.targetIndex) onReorder(current.id, current.targetIndex);
    }
    updateDrag(null);
  };
  const stopSuppressedClick = (event) => {
    if (!suppressClickRef.current) return;
    event.preventDefault(); event.stopPropagation(); suppressClickRef.current = false;
  };
  useEffect(() => {
    if (!drag?.pointerId) return undefined;
    const move = (event) => continueDrag(event);
    const up = (event) => finishDrag(event);
    const cancel = (event) => finishDrag(event, true);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", cancel);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", cancel);
    };
  }, [drag?.pointerId]);
  const previewOrder = drag?.active ? [...order] : order;
  if (drag?.active) {
    if (previewOrder[drag.targetIndex] === null) {
      previewOrder[drag.sourceIndex] = null;
      previewOrder[drag.targetIndex] = drag.id;
    } else {
      const [moved] = previewOrder.splice(drag.sourceIndex, 1);
      previewOrder.splice(drag.targetIndex, 0, moved);
    }
  }
  const draggedItem = drag?.active ? orderedItems.find((item) => item?.id === drag.id) : null;
  return <div ref={gridRef} className={`${className} dashboard-reorder-grid${drag?.active ? " is-dragging" : ""}${editing ? " is-customizing" : ""}`}>
    {orderedItems.map((item, index) => {
      const slot = slots[index];
      if (!item) return <div className="dashboard-reorder-item dashboard-empty-slot" data-dashboard-slot={index} style={{ gridColumn: slot.column, gridRow: slot.row }} key={`empty-${index}`} aria-label="Свободное место для виджета"><button onClick={onOpenCatalog}><IconPlus size={17} />Добавить виджет</button><span>или перетащите сюда</span></div>;
      const destinationIndex = previewOrder.indexOf(item.id);
      const from = drag?.rects[index]; const to = drag?.rects[destinationIndex];
      const transform = drag?.active && item.id !== drag.id && from && to ? `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${to.width / from.width}, ${to.height / from.height})` : "translate(0, 0) scale(1)";
      return <div className={`dashboard-reorder-item dashboard-slot-${slot.kind}${drag?.active && item.id === drag.id ? " drag-origin" : ""}`} data-dashboard-id={item.id} data-dashboard-slot={index} style={{ transform, gridColumn: slot.column, gridRow: slot.row }} key={item.id} onPointerDown={(event) => startDrag(event, item, index)} onClickCapture={stopSuppressedClick} aria-grabbed={drag?.active && item.id === drag.id}>
        {renderItem(item, slot.kind)}
        <span className="dashboard-drag-handle" aria-hidden="true"><IconGripVertical size={18} /></span>
      </div>;
    })}
    {drag?.active && <span className="dashboard-drop-slot" style={{ left: `${drag.rects[drag.targetIndex].left - drag.gridLeft}px`, top: `${drag.rects[drag.targetIndex].top - drag.gridTop}px`, width: `${drag.rects[drag.targetIndex].width}px`, height: `${drag.rects[drag.targetIndex].height}px` }} aria-hidden="true" />}
    {draggedItem && (() => { const targetRect = drag.rects[drag.targetIndex]; const targetSlot = slots[drag.targetIndex]; return <div className={`dashboard-drag-overlay dashboard-slot-${targetSlot.kind}`} style={{ left: `${drag.pointerX - drag.gridLeft - targetRect.width * drag.offsetRatioX}px`, top: `${drag.pointerY - drag.gridTop - targetRect.height * drag.offsetRatioY}px`, width: `${targetRect.width}px`, height: `${targetRect.height}px` }} aria-hidden="true">{renderItem(draggedItem, targetSlot.kind)}</div>; })()}
  </div>;
}

function DashboardPanel({ title, className = "", action, onHide, children }) { return <article className={`home-dashboard-panel ${className}`}><header><div><h2>{title}</h2><IconInfoCircle size={14} /></div><span>{action}<button className="home-panel-menu" aria-label={`Скрыть виджет: ${title}`} title="Скрыть виджет" onClick={onHide}><IconDotsVertical size={19} /></button></span></header>{children}</article>; }

function useCanvas(draw) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    let disposed = false;
    const render = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * ratio)); canvas.height = Math.max(1, Math.round(rect.height * ratio));
      const context = canvas.getContext("2d"); context.setTransform(ratio, 0, 0, ratio, 0, 0); context.clearRect(0, 0, rect.width, rect.height); draw(context, rect.width, rect.height);
    };
    render();
    const observer = new ResizeObserver(render); observer.observe(canvas);
    if (document.fonts) {
      Promise.all([
        document.fonts.load("400 10px Inter", "звонков 22.06"),
        document.fonts.load("600 22px Inter", "2 001"),
      ]).then(() => { if (!disposed) render(); }).catch(() => {});
    }
    return () => { disposed = true; observer.disconnect(); };
  }, [draw]);
  return ref;
}

function Sparkline({ values, color = "#85b91d" }) {
  const draw = (context, width, height) => { const padding = 3; const min = Math.min(...values); const max = Math.max(...values); context.beginPath(); values.forEach((value, index) => { const x = padding + (index / (values.length - 1)) * (width - padding * 2); const y = height - padding - ((value - min) / Math.max(1, max - min)) * (height - padding * 2); index ? context.lineTo(x, y) : context.moveTo(x, y); }); context.strokeStyle = color; context.lineWidth = 2; context.lineCap = "round"; context.lineJoin = "round"; context.stroke(); };
  const ref = useCanvas(draw); return <canvas ref={ref} className="home-sparkline" aria-hidden="true" />;
}

function DashboardLineChart() {
  const values = [20, 38, 80, 93, 88, 91, 94, 96, 82];
  const labels = ["22.06", "", "29.06", "", "06.07", "13.07", "20.07", "", "27.07"];
  const draw = (context, width, height) => {
    const left = 45, right = 10, top = 12, bottom = 28, chartW = width - left - right, chartH = height - top - bottom;
    context.font = "10px Inter, Arial, sans-serif"; context.fillStyle = "#7b8082"; context.textAlign = "right"; context.textBaseline = "middle";
    [0, 25, 50, 75, 100].forEach((tick) => { const y = top + chartH - (tick / 100) * chartH; context.strokeStyle = "#e8ecea"; context.lineWidth = 1; context.beginPath(); context.moveTo(left, y); context.lineTo(width - right, y); context.stroke(); context.fillText(`${tick}%`, left - 10, y); });
    const points = values.map((value, index) => [left + (index / (values.length - 1)) * chartW, top + chartH - (value / 100) * chartH]);
    const fill = context.createLinearGradient(0, top, 0, top + chartH); fill.addColorStop(0, "rgba(20,173,103,.28)"); fill.addColorStop(1, "rgba(20,173,103,.02)"); context.beginPath(); context.moveTo(points[0][0], top + chartH); points.forEach(([x, y]) => context.lineTo(x, y)); context.lineTo(points.at(-1)[0], top + chartH); context.closePath(); context.fillStyle = fill; context.fill();
    context.beginPath(); points.forEach(([x, y], index) => index ? context.lineTo(x, y) : context.moveTo(x, y)); context.strokeStyle = "#12aa66"; context.lineWidth = 2; context.stroke();
    points.forEach(([x, y]) => { context.beginPath(); context.arc(x, y, 4, 0, Math.PI * 2); context.fillStyle = "#fff"; context.fill(); context.strokeStyle = "#12aa66"; context.lineWidth = 2; context.stroke(); });
    context.textAlign = "center"; context.textBaseline = "top"; context.fillStyle = "#6f7476"; labels.forEach((label, index) => label && context.fillText(label, left + (index / (labels.length - 1)) * chartW, height - 18));
  };
  const ref = useCanvas(draw); return <canvas ref={ref} className="home-line-chart" aria-label="Динамика средней оценки от 20 до 96 процентов" />;
}

function DonutChart() {
  const draw = (context, width, height) => { const size = Math.min(width, height); const cx = width / 2, cy = height / 2, radius = size * .37, thickness = size * .12; let start = -Math.PI / 2; [[65, "#16ad67"], [20, "#f3b400"], [10, "#f2750a"], [5, "#f13b35"]].forEach(([value, color]) => { const end = start + (value / 100) * Math.PI * 2; context.beginPath(); context.arc(cx, cy, radius, start, end); context.strokeStyle = color; context.lineWidth = thickness; context.stroke(); start = end; }); context.textAlign = "center"; context.fillStyle = "#171717"; context.font = "600 22px Inter, Arial, sans-serif"; context.fillText("2 001", cx, cy + 1); context.fillStyle = "#656a6c"; context.font = "10px Inter, Arial, sans-serif"; context.fillText("звонков", cx, cy + 21); };
  const ref = useCanvas(draw); return <canvas ref={ref} className="home-donut-chart" aria-label="Распределение оценок: отлично 65 процентов, хорошо 20 процентов, удовлетворительно 10 процентов, плохо 5 процентов" />;
}

function AnalyticsPage({ notify }) {
  return <section><div className="title-row"><PageTitle>Аналитик</PageTitle><button className="dark-button" onClick={() => notify("Отчет подготовлен")}>Сформировать отчет <IconReportAnalytics size={20} /></button></div><div className="analytics-grid">{["Обработанные звонки", "Средняя оценка", "Средняя длительность"].map((label, index) => <div className="metric-card large" key={label}><span>{label}</span><strong>{[1, "100%", "4 мин"][index]}</strong><small>За последние 30 дней</small></div>)}</div><div className="chart-card analytics-chart"><h3>Динамика качества звонков</h3><div className="empty-chart"><IconReportAnalytics size={36} stroke={1.3} /><strong>Данных пока недостаточно</strong><span>Загрузите новые звонки, чтобы увидеть динамику</span></div></div></section>;
}

function TrainerPage() {
  return <section><PageTitle>Тренер</PageTitle></section>;
}

function TemplatesPage({ notify }) {
  return <section><div className="title-row"><PageTitle>Шаблоны</PageTitle><button className="dark-button" onClick={() => notify("Новый шаблон создан")}>Создать <IconPlus size={21} /></button></div><div className="split-layout templates-layout"><aside className="inner-sidebar"><div className="inner-title">Список шаблонов</div><button className="inner-item active"><span>Стандартный шаблон оценки качества</span><strong>1</strong></button></aside><div className="content-panel"><div className="content-panel-head"><div><h2>Стандартный шаблон оценки качества</h2><p>Системные и пользовательские категории анализа</p></div><button className="light-button" onClick={() => notify("Изменения сохранены")}><IconDeviceFloppy size={18} />Сохранить</button></div><div className="template-section"><h3>Системные категории</h3><div className="template-grid">{["Вероятность успеха звонка", "Вежливость", "Потребность", "Качество презентации"].map((name, index) => <button className="template-card" key={name}><span className="template-icon">%</span><div><strong>{name}</strong><p>{["Оценка шансов достичь результата", "Корректность и уважительность общения", "Выявление реальных потребностей", "Структура и персонализация презентации"][index]}</p></div><IconChevronRight size={19} /></button>)}</div></div></div></div></section>;
}

function EmployeesPage({ notify }) {
  const [query, setQuery] = useState("");
  const [departments, setDepartments] = useState(["12312", "231"]);
  const addDepartment = () => { setDepartments([...departments, `Новый отдел ${departments.length + 1}`]); notify("Отдел создан"); };
  return <section><div className="title-row"><PageTitle>Сотрудники</PageTitle><div className="row-actions"><button className="light-button" onClick={() => notify("Дубли не найдены")}><IconUsers size={20} />Поиск дублей</button><button className="dark-button" onClick={addDepartment}><IconPlus size={22} />Создать отдел</button></div></div><div className="employees-layout"><aside className="department-panel"><div className="inner-title">Список отделов компании <button className="header-icon mini"><IconAdjustmentsHorizontal size={17} /></button></div><label className="search-field block"><IconSearch size={19} /><input placeholder="Поиск по отделам" /></label><button className="department-item active"><strong>Все сотрудники</strong><small>1 сотрудник</small></button>{departments.map((name, index) => <button className="department-item" key={name}><strong>{name}</strong><small className={index ? "danger-text" : ""}>{index ? "Нет сотрудников" : "1 сотрудник"}</small><span>⋮</span></button>)}<div className="department-note"><IconUsers size={20} /><span>Добавить/удалить сотрудника можно только в <b>Личном кабинете</b></span></div></aside><div className="employees-table-panel"><div className="table-toolbar"><button className="header-icon"><IconAdjustmentsHorizontal size={19} /></button><label className="search-field"><IconSearch size={19} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Поиск" /></label><span>На странице по: <b>25</b></span><span>Всего строк: 1</span></div><div className="employees-table"><div className="employee-table-row table-head-row"><span></span><span>ФИО сотрудника</span><span>Отдел</span><span>Источник</span><span>Привязанный шаблон</span><span>Роль</span></div>{!query || "Самойленко Даниил".toLowerCase().includes(query.toLowerCase()) ? <div className="employee-table-row"><input type="checkbox" /><strong>Самойленко Даниил</strong><span>12312</span><span><em className="source-tag">IQ Mentor</em></span><span>Стандартный шаблон оценки качества</span><span>Администратор</span></div> : <div className="table-empty">Сотрудники не найдены</div>}</div></div></div></section>;
}

function DocumentsPage({ notify, embedded = false }) {
  const [modal, setModal] = useState(false); const [type, setType] = useState("Нормативные документы"); const [keywords, setKeywords] = useState([]); const [keyword, setKeyword] = useState(""); const [files, setFiles] = useState([]); const inputRef = useRef(null);
  const addKeyword = () => { if (!keyword.trim() || keywords.length >= 8) return; setKeywords([...keywords, keyword.trim()]); setKeyword(""); notify("Ключевое слово добавлено"); };
  return <section className={embedded ? "documents-settings-embedded" : ""}>{!embedded && <PageTitle>Документы</PageTitle>}<div className="documents-layout"><div className="documents-main"><div className="document-type-card"><label>Выберите формат документов</label><div className="type-control"><span>{type}</span><button className="light-button" onClick={() => setModal(true)}><IconSwitchHorizontal size={19} />Сменить тип</button></div></div><div className="upload-card"><div className="upload-head"><div><h3>Загруженные файлы</h3><p>Загрузите скрипты продаж, стандарты обслуживания и инструкции. ИИ проанализирует документы,<br />выделит обязательные этапы диалога и создаст персональные категории для анализа.</p></div><button className="light-button" disabled={!files.length}><IconUpload size={19} />Загрузить документы</button></div><input ref={inputRef} hidden multiple type="file" onChange={(e) => setFiles([...e.target.files])} /><button className="dropzone" onClick={() => inputRef.current?.click()}><strong><IconCirclePlus size={23} /><span>Выберите</span> или перетащите файлы</strong><small>Вы можете загрузить до 5 файлов в форматах: PDF/TXT/DOCX/XLSX.<br />Размер каждого файла — от 1 Б до 4 МБ.</small></button>{files.length > 0 && <div className="file-list">{files.slice(0, 5).map((file) => <span key={file.name}><IconFile size={17} />{file.name}</span>)}</div>}</div></div><aside className="documents-side"><div className="context-card"><div className="file-empty"><IconFile size={42} stroke={1.2} /><span>Нет файла</span></div><div><span className="status-pill">Не используется</span><h3>Контекст</h3><p>Свод правил из ваших документов и стандартов. Используйте файл как основу для генерации категорий оценки.</p><button className="orange-button" disabled><IconSparkles size={18} />Категории</button></div></div><div className="keywords-card"><div className="card-heading"><h3>Ключевые слова</h3><span className="counter">{keywords.length}/8</span></div><p>Ключевые слова — это короткие фразы, по которым клиенты находят ваш товар или услугу. Например, для магазина велосипедов: велосипед, горный велосипед, доставка, ремонт.</p><label>Введите ключевое слово</label><div className="keyword-input"><input value={keyword} onChange={(e) => setKeyword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKeyword()} placeholder="Добавить" /><button onClick={addKeyword}><IconPlus size={21} /></button></div><div className="keyword-chips">{keywords.map((word) => <button key={word} onClick={() => setKeywords(keywords.filter((item) => item !== word))}>{word}<IconX size={14} /></button>)}</div><small><IconInfoCircle size={15} />Вы можете добавить от 3 до 8 ключевых слов для лучшего результата</small></div></aside></div>{modal && <DocumentTypeModal type={type} setType={setType} close={() => setModal(false)} notify={notify} />}</section>;
}

function DocumentTypeModal({ type, setType, close, notify }) {
  const [draft, setDraft] = useState(type);
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}><div className="modal-card"><div className="modal-title"><h2>Выберите тип документов</h2><button className="header-icon" onClick={close}><IconX size={18} /></button></div><div className="modal-recommendation">Мы рекомендуем использовать <b>Нормативные документы</b> — так результат будет более точным и структурированным.</div><div className="type-tiles"><button className={draft === "Нормативные документы" ? "selected" : ""} onClick={() => setDraft("Нормативные документы")}><small>Рекомендуем</small><strong>Нормативные документы</strong><span>PDF/TXT/DOCX/XLSX</span></button><button className={draft === "Звонки" ? "selected" : ""} onClick={() => setDraft("Звонки")}><strong>Звонки</strong><span>mp3</span></button></div><p className="modal-note"><IconInfoCircle size={15} />Для изменения типа документов — удалите все загруженные и сгенерированные файлы</p><button className="dark-button wide" onClick={() => { setType(draft); close(); notify("Тип документов изменен"); }}>Подтвердить</button></div></div>;
}

function SettingsPage({ active, setActive, settings, update, notify }) {
  const activeItem = SETTINGS_GROUPS.flatMap((group) => group.items).find((item) => item.id === active);
  const activeGroup = SETTINGS_GROUPS.find((group) => group.items.some((item) => item.id === active));
  const getTone = (title) => title === "Аналитик" ? "analyst" : title === "Тренер" ? "trainer" : "general";
  const ActiveIcon = activeItem.icon;
  return <section><PageTitle>Настройки</PageTitle><div className="settings-layout"><aside className="settings-nav-panel"><div className="inner-title">Разделы настроек</div>{SETTINGS_GROUPS.map((group) => { const tone = getTone(group.title); return <div className={`settings-group tone-${tone}`} key={group.title}><h3>{group.title}</h3>{group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}><span className="settings-item-icon"><Icon size={18} stroke={1.7} /></span><span>{item.label}</span><IconChevronRight size={17} /></button>; })}</div>; })}</aside><div className={`settings-content tone-${getTone(activeGroup.title)}`}><div className="settings-content-head"><div className="settings-title-icon"><ActiveIcon size={23} stroke={1.7} /></div><div><span className="settings-kicker">{activeGroup.title}</span><h2>{activeItem.label}</h2></div></div><SettingsSection id={active} settings={settings} update={update} notify={notify} /></div></div></section>;
}

function SettingsSection({ id, settings, update, notify }) {
  const save = () => notify("Настройки сохранены");
  if (id === "documents") return <DocumentsPage notify={notify} embedded />;
  if (id === "employees") return <div className="employees-settings-embedded"><EmployeesPage notify={notify} /></div>;
  if (id === "profile") return <ProfileSettings value={settings.profile} onChange={(key, value) => update((next) => { next.profile[key] = value; })} save={save} />;
  if (id === "company") return <CompanySettings value={settings.company} onChange={(key, value) => update((next) => { next.company[key] = value; })} save={save} />;
  if (id === "security") return <SecuritySettings value={settings.security} onChange={(key, value) => update((next) => { next.security[key] = value; })} save={save} notify={notify} />;
  if (id === "access") return <AccessSettings value={settings.access} update={update} save={save} />;
  if (id === "analyst-notifications" || id === "trainer-notifications") { const kind = id.startsWith("analyst") ? "analyst" : "trainer"; return <NotificationSettings kind={kind} value={settings.notifications[kind]} update={update} save={save} />; }
  if (id === "integrations") return <IntegrationsSettings value={settings.integrations} update={update} notify={notify} />;
  if (id === "analyst-reports" || id === "trainer-reports") { const kind = id.startsWith("analyst") ? "analyst" : "trainer"; return <ReportSettings kind={kind} value={settings.reports[kind]} update={update} save={save} notify={notify} />; }
  if (id === "stereo") return <StereoSettings value={settings.stereo} update={update} save={save} notify={notify} />;
  return <ScoringSettings value={settings.scoring} update={update} save={save} notify={notify} />;
}

function SettingsForm({ children, onSave }) { return <form className="settings-form" onSubmit={(e) => { e.preventDefault(); onSave(); }}>{children}<div className="settings-actions"><button type="submit" className="dark-button"><IconDeviceFloppy size={19} />Сохранить</button></div></form>; }
function Field({ label, children, hint }) { return <label className="form-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>; }

function ProfileSettings({ value, onChange, save }) { return <SettingsForm onSave={save}><div className="form-section"><h3>Личные данные</h3><p>Информация отображается в IQ Mentor и отчетах.</p><div className="form-grid"><Field label="ФИО"><input value={value.name} onChange={(e) => onChange("name", e.target.value)} /></Field><Field label="Должность"><input value={value.position} onChange={(e) => onChange("position", e.target.value)} /></Field><Field label="Email"><input type="email" value={value.email} onChange={(e) => onChange("email", e.target.value)} /></Field><Field label="Телефон"><input value={value.phone} onChange={(e) => onChange("phone", e.target.value)} placeholder="+7 (___) ___-__-__" /></Field></div></div></SettingsForm>; }
function CompanySettings({ value, onChange, save }) { return <SettingsForm onSave={save}><div className="form-section"><h3>Данные компании</h3><p>Общие сведения для документов и аналитических отчетов.</p><div className="form-grid"><Field label="Название компании"><input value={value.name} onChange={(e) => onChange("name", e.target.value)} /></Field><Field label="ИНН"><input value={value.inn} onChange={(e) => onChange("inn", e.target.value)} placeholder="Введите ИНН" /></Field><Field label="Отрасль"><select value={value.industry} onChange={(e) => onChange("industry", e.target.value)}><option>IT и телеком</option><option>Ритейл</option><option>Услуги</option><option>Финансы</option></select></Field><Field label="Часовой пояс"><select value={value.timezone} onChange={(e) => onChange("timezone", e.target.value)}><option value="Europe/Samara">Самара (UTC+4)</option><option value="Europe/Moscow">Москва (UTC+3)</option><option value="Asia/Yekaterinburg">Екатеринбург (UTC+5)</option></select></Field></div></div></SettingsForm>; }
function SecuritySettings({ value, onChange, save, notify }) { return <SettingsForm onSave={save}><div className="form-section"><h3>Смена пароля</h3><p>Используйте не менее 8 символов, цифры и специальные знаки.</p><div className="form-grid"><Field label="Текущий пароль"><input type="password" placeholder="••••••••" /></Field><span></span><Field label="Новый пароль"><input type="password" placeholder="Не менее 8 символов" /></Field><Field label="Повторите пароль"><input type="password" placeholder="Повторите пароль" /></Field></div></div><div className="form-section"><h3>Дополнительная защита</h3><SettingToggle title="Двухфакторная аутентификация" description="Подтверждать вход одноразовым кодом" checked={value.twoFactor} onChange={(checked) => onChange("twoFactor", checked)} /><SettingToggle title="Контроль активных сессий" description="Получать уведомление о входе с нового устройства" checked={value.sessions} onChange={(checked) => onChange("sessions", checked)} /><button type="button" className="light-button inline-action" onClick={() => notify("Резервные коды обновлены")}><IconKey size={18} />Создать резервные коды</button></div></SettingsForm>; }

function AccessSettings({ value, update, save }) {
  const rights = ["calls", "reports", "employees", "settings"]; const labels = { calls: "Звонки", reports: "Отчеты", employees: "Сотрудники", settings: "Настройки" }; const roles = { manager: "Руководитель", analyst: "Аналитик", admin: "Администратор" };
  return <SettingsForm onSave={save}><div className="form-section"><h3>Права сотрудников</h3><p>Настройте доступ к разделам IQ Mentor для каждой роли.</p><div className="rights-table"><div className="rights-row rights-head"><span>Роль</span>{rights.map((right) => <span key={right}>{labels[right]}</span>)}</div>{Object.entries(roles).map(([role, label]) => <div className="rights-row" key={role}><strong>{label}</strong>{rights.map((right) => <label className="check-control" key={right}><input type="checkbox" checked={value[role][right]} disabled={role === "admin"} onChange={(e) => update((next) => { next.access[role][right] = e.target.checked; })} /><span><IconCheck size={14} /></span></label>)}</div>)}</div></div></SettingsForm>;
}

function NotificationSettings({ kind, value, update }) {
  const events = [
    ["submitted", "Звонок отправлен на оценку", false],
    ["analysisComplete", "Анализ звонка завершен", true],
    ["reportPreparing", "Подготовка отчета", true],
    ["reportComplete", "Генерация отчета завершена", true],
  ];
  const defaults = {
    submitted: { display: false, sound: true },
    analysisComplete: { display: true, sound: true },
    reportPreparing: { display: true, sound: true },
    reportComplete: { display: true, sound: true },
  };
  const checked = (event, channel) => value.events?.[event]?.[channel] ?? defaults[event][channel];
  const change = (event, channel, enabled) => update((next) => {
    next.notifications[kind].events ??= {};
    next.notifications[kind].events[event] = { ...defaults[event], ...next.notifications[kind].events[event], [channel]: enabled };
  });
  return <div className={`notification-settings notification-${kind}`}><div className="notification-table"><div className="notification-row notification-head"><span>Событие</span><span>Отображение</span><span>Звук</span></div>{events.map(([key, title, hasDisplay]) => <div className="notification-row" key={key}><span>{title}</span><span>{hasDisplay && <NotificationSwitch label={`Отображение: ${title}`} checked={checked(key, "display")} onChange={(enabled) => change(key, "display", enabled)} />}</span><span><NotificationSwitch label={`Звук: ${title}`} checked={checked(key, "sound")} onChange={(enabled) => change(key, "sound", enabled)} /></span></div>)}</div></div>;
}

function NotificationSwitch({ label, checked, onChange }) {
  return <label className="notification-switch" aria-label={label}><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i></i></label>;
}

function IntegrationLogo({ service, large = false }) {
  const logos = { bitrix: bitrix24Logo, yandex: yandexDiskLogo, amo: amoCrmLogo };
  const names = { bitrix: "Bitrix24", yandex: "Яндекс Диск", amo: "amoCRM" };
  return <img className={`service-brand-logo service-brand-logo-${service}${large ? " large" : ""}`} src={logos[service]} alt={`Логотип ${names[service]}`} />;
}

function IntegrationsSettings({ value, update, notify }) {
  const [active, setActive] = useState("bitrix");
  const services = [
    { key: "bitrix", name: "Bitrix24" },
    { key: "yandex", name: "Яндекс Диск" },
    { key: "amo", name: "amoCRM" },
  ];
  const tokenDefaults = { bitrix: "b24_7f3c9a1d5e8b2f6a4c0d", amo: "amo_4e8b2f6a7f3c9a1d5e0b" };
  const selected = services.find((service) => service.key === active);
  const integration = value[active];
  const toggleConnection = (key, name) => {
    const wasConnected = value[key].connected;
    update((next) => { next.integrations[key].connected = !wasConnected; });
    notify(wasConnected ? `${name} отключен` : `${name} подключен`);
  };
  const regenerateToken = (key) => {
    const prefix = key === "bitrix" ? "b24" : "amo";
    const token = `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 24)}`;
    update((next) => { next.integrations[key].token = token; next.integrations[key].connected = true; });
    notify("Ключ-токен обновлен");
  };
  const copyToken = async (token) => {
    try { await navigator.clipboard.writeText(token); notify("Ключ-токен скопирован"); }
    catch { notify("Не удалось скопировать ключ-токен"); }
  };
  return <div className="integration-workspace"><aside className="integration-service-list"><div className="integration-list-heading"><h3>Сервисы</h3></div>{services.map((service) => { const connected = value[service.key].connected; return <button key={service.key} className={active === service.key ? "active" : ""} onClick={() => setActive(service.key)}><span className="integration-service-icon"><IntegrationLogo service={service.key} /></span><strong>{service.name}</strong><i className={connected ? "connected-dot" : ""}></i></button>; })}</aside><section className="integration-detail"><div className="integration-detail-head"><div className="integration-detail-icon"><IntegrationLogo service={selected.key} large /></div><div><h3>{selected.name}</h3></div><em className={integration.connected ? "integration-status connected" : "integration-status"}>{integration.connected ? "Подключено" : "Не подключено"}</em></div>{active === "yandex" ? <YandexIntegration connected={integration.connected} toggle={() => toggleConnection("yandex", "Яндекс Диск")} /> : <TokenIntegration service={active} connected={integration.connected} token={integration.token || tokenDefaults[active]} regenerate={() => regenerateToken(active)} copy={copyToken} toggle={() => toggleConnection(active, selected.name)} />}</section></div>;
}

function YandexIntegration({ connected, toggle }) {
  return <div className="integration-detail-body"><div className="integration-warning"><IconInfoCircle size={21} /><div><strong>Важно</strong><p>Переносятся только звонки, которые появятся в папке после подключения.<br />То, что лежало там раньше, мы не трогаем и не импортируем.</p></div></div><div className="yandex-connect"><span>{connected ? "Яндекс Диск подключен" : "Яндекс Диск не подключен"}</span><h4>{connected ? "Записи звонков синхронизируются" : "Подключите Яндекс Диск"}</h4><p>{connected ? "Новые записи из выбранной папки автоматически переносятся в Аналитик." : "Дайте доступ к папке на Диске. Мы будем автоматически забирать оттуда новые записи звонков и переносить их в Аналитик."}</p><button className={connected ? "light-button" : "dark-button"} onClick={toggle}>{connected ? "Отключить" : "Войти через Яндекс"}</button></div></div>;
}

function TokenIntegration({ service, connected, token, regenerate, copy, toggle }) {
  const isBitrix = service === "bitrix";
  return <div className="integration-detail-body"><div className="token-integration-copy"><span>{isBitrix ? "Интеграция с Битрикс24" : "Интеграция с amoCRM"}</span><h4>{isBitrix ? "Интеграция позволяет связать сервис Б24 с IQ Mentor" : "Свяжите amoCRM с IQ Mentor"}</h4><p>{isBitrix ? "После настройки новые звонки автоматически подтягиваются в CRM: фиксируются входящие и исходящие вызовы, номера, длительность и запись разговора." : "После подключения звонки, сделки и контакты синхронизируются с IQ Mentor. Записи разговоров автоматически передаются в Аналитик."}</p><p>{isBitrix ? "Звонки можно привязывать к сделкам, лидам и контактам. Структура сотрудников из Битрикс24 помогает корректно распределять записи по менеджерам." : "Система связывает звонки со сделками и ответственными менеджерами, сохраняя актуальную структуру команды."}</p><p>Подключение выполняется один раз через ключ-токен, после чего интеграция работает автоматически.</p></div><div className="integration-token-row"><div className="integration-token"><IconKey size={20} /><input value={token.replace(/./g, "•")} readOnly aria-label={`Ключ-токен ${isBitrix ? "Bitrix24" : "amoCRM"}`} /></div><button className="token-copy-button" aria-label="Скопировать ключ-токен" onClick={() => copy(token)}><IconCopy size={19} /></button><button className="orange-button" onClick={regenerate}><IconSwitchHorizontal size={18} />{connected ? "Перегенерировать" : "Создать токен"}</button></div>{connected && <button className="integration-disconnect" onClick={toggle}>Отключить интеграцию</button>}</div>;
}

function ReportSettings({ kind, value, update, save, notify }) {
  const initialPeriods = () => ({
    day: value.periods?.day ?? false,
    week: value.periods?.week ?? false,
    month: value.periods?.month ?? false,
  });
  const [periods, setPeriods] = useState(initialPeriods);
  useEffect(() => setPeriods(initialPeriods()), [kind]);
  const reset = () => setPeriods(initialPeriods());
  const submit = () => {
    update((next) => {
      next.reports[kind].periods = periods;
      next.reports[kind].enabled = Object.values(periods).some(Boolean);
    });
    save();
  };
  const rows = [["day", "За прошедший день"], ["week", "За прошедшую неделю"], ["month", "За прошедший месяц"]];
  return <div className={`report-generator-card tone-${kind}`}><div className="report-generator-title"><h3>Автоматическая генерация</h3><button type="button" className="report-close" aria-label="Закрыть" onClick={() => { reset(); notify("Изменения отменены"); }}><IconX size={18} /></button></div><p>Настройте, как часто система будет автоматически создавать отчет по категориям:</p><div className="report-period-list">{rows.map(([key, label]) => <label className="report-period" key={key}><input type="checkbox" checked={periods[key]} onChange={(e) => setPeriods({ ...periods, [key]: e.target.checked })} /><i></i><span>{label}</span></label>)}</div><div className="report-generator-actions"><button type="button" className="dark-button" onClick={submit}>Сохранить</button></div></div>;
}

function StereoSettings({ value, update, save, notify }) {
  const current = value.format || (value.left === "Клиент" ? "client-left" : "operator-left");
  const change = (format) => update((next) => {
    next.stereo.format = format;
    next.stereo.mode = "Стерео";
    next.stereo.left = format === "operator-left" ? "Сотрудник" : "Клиент";
    next.stereo.right = format === "operator-left" ? "Клиент" : "Сотрудник";
  });
  return <form className="stereo-format-form" onSubmit={(e) => { e.preventDefault(); save(); }}><div className="stereo-format-section"><label className="stereo-format-field"><span>Стереоформат звонков</span><p>Выберите, в каком канале стереозаписи находятся оператор и клиент. Настройка применяется ко всем входящим звонкам, передаваемым на анализ.</p><div className="stereo-format-note"><IconInfoCircle size={18} /><span><strong>Что это такое?</strong>Звонок записывается в два отдельных канала: L — левый, R — правый. Укажите, где слышно оператора, а где клиента — так система правильно различит участников разговора.</span></div><select value={current} onChange={(e) => change(e.target.value)}><option value="operator-left">L (Оператор), R (Клиент) (по умолчанию)</option><option value="client-left">L (Клиент), R (Оператор)</option></select></label></div><div className="stereo-format-actions"><button type="submit" className="dark-button">Сохранить</button></div></form>;
}

function ScoringSettings({ value, update, save, notify }) {
  const initialDraft = () => ({ minDuration: value.minDuration || "00:00:30", autoAnalyze: value.autoAnalyze ?? false });
  const [draft, setDraft] = useState(initialDraft);
  const reset = () => { setDraft(initialDraft()); notify("Изменения отменены"); };
  const submit = () => {
    update((next) => { next.scoring.minDuration = draft.minDuration; next.scoring.autoAnalyze = draft.autoAnalyze; });
    save();
  };
  return <form className="scoring-settings-form" onSubmit={(e) => { e.preventDefault(); submit(); }}><button type="button" className="report-close scoring-close" aria-label="Закрыть" onClick={reset}><IconX size={18} /></button><div className="scoring-settings-content"><label className="scoring-duration-field"><span>Минимальная длительность звонка</span><div><IconClock size={19} /><input value={draft.minDuration} onChange={(e) => setDraft({ ...draft, minDuration: e.target.value })} aria-label="Минимальная длительность звонка" /></div></label><label className="scoring-auto-check"><input type="checkbox" checked={draft.autoAnalyze} onChange={(e) => setDraft({ ...draft, autoAnalyze: e.target.checked })} /><i><IconCheck size={14} /></i><span><strong>Автоматически отправлять звонок на анализ</strong><small>Не придется запускать анализ вручную</small></span></label></div><div className="scoring-settings-actions"><button type="submit" className="dark-button">Сохранить</button></div></form>;
}

function SettingToggle({ title, description, checked, onChange }) { return <label className="setting-toggle"><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /><i></i></label>; }
