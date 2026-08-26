import { useEffect, useRef, useState } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import bitrix24Logo from "./assets/integrations/bitrix24.png";
import amoCrmLogo from "./assets/integrations/amocrm.png";
import yandexDiskLogo from "./assets/integrations/yandex-disk.png";
import {
  IconAdjustmentsHorizontal, IconBell, IconBook2, IconBuilding, IconCalendar, IconCheck, IconClock,
  IconChevronDown, IconChevronRight, IconCirclePlus, IconCopy, IconCrown, IconDeviceFloppy, IconFile,
  IconFileText, IconFolder, IconHeadphones, IconHome, IconInfoCircle, IconKey, IconLock,
  IconMenu2, IconPlus, IconPlugConnected, IconReportAnalytics, IconSearch, IconSettings,
  IconShieldCheck, IconSchool, IconSparkles, IconSwitchHorizontal, IconTemplate, IconUpload,
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
        {page === "home" && <HomePage />}
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
  return <header className="topbar">
    <span className="topbar-page">{PAGE_LABELS[page]}</span>
    <button className="mentor-brand" onClick={() => setPage("home")}><img src="/iq-logo.svg" alt="IQ" /><span></span><em>Ментор</em></button>
    <div className="topbar-actions"><div className="balance">Баланс <strong>990 / 500</strong></div><button className="header-icon" aria-label="Уведомления"><IconBell size={21} stroke={1.5} /></button><button className="header-icon" aria-label="Поддержка"><IconHeadphones size={21} stroke={1.5} /></button><button className="lk-small">в ЛК <IconSwitchHorizontal size={18} /></button></div>
  </header>;
}

function PageTitle({ children, badge }) { return <div className="page-title"><h1>{children}</h1>{badge && <span>{badge}</span>}</div>; }

function HomePage() {
  const categories = [["Вежливость", 100, "green"], ["Вероятность успеха звонка", 75, "blue"], ["Потребность", 35, "red"], ["Качество презентации", 25, "orange"], ["223", 0, "purple"]];
  const dates = ["22.06", "29.06", "06.07", "13.07", "20.07", "27.07"];
  const series = [["#09a969", "-30deg"], ["#aad5ff", "-22deg"], ["#ffc1c1", "-10deg"], ["#ffd79b", "-7deg"], ["#d7c1ff", "0deg"]];
  return <section>
    <div className="title-row"><PageTitle badge="AI Аналитик">Главная</PageTitle><button className="dark-button">Отчет по звонкам <IconChevronRight size={22} /></button></div>
    <div className="dashboard-filters"><button className="field-like"><IconUser size={19} />Все сотрудники<IconChevronDown size={18} /></button><button className="field-like muted"><IconTemplate size={19} />Все шаблоны<IconChevronDown size={18} /></button><button className="field-like date"><IconCalendar size={19} />28.06.2026-28.07.2026</button></div>
    <div className="metric-grid"><div className="metric-card"><span>Кол-во обработаных звонков</span><strong>1</strong></div><div className="metric-card"><span>Длительность обработаных звонков</span><strong>4 <small>минут</small></strong></div></div>
    <div className="chart-card"><h3>Средняя оценка по категориям (%)</h3><div className="chart-area">{[0, 20, 40, 60, 80, 100].map((value) => <span key={value} style={{ bottom: `${value}%` }}>{value}</span>)}<div className="chart-grid">{[20, 40, 60, 80].map((value) => <b key={`h-${value}`} style={{ bottom: `${value}%` }}></b>)}{[20, 40, 60, 80].map((value) => <i key={`v-${value}`} style={{ left: `${value}%` }}></i>)}</div>{series.map(([color, angle]) => <div className="chart-line" key={color} style={{ "--line-color": color, "--line-angle": angle }}></div>)}{dates.map((date, index) => <div className="chart-point" style={{ left: `${index * 20}%`, bottom: index === dates.length - 1 ? "100%" : "0%" }} key={date}><i></i></div>)}<div className="chart-labels">{dates.map((date, index) => <small key={date} style={{ left: `${index * 20}%`, transform: index === 0 ? "none" : index === dates.length - 1 ? "translateX(-100%)" : "translateX(-50%)" }}>{date}</small>)}</div></div></div>
    <div className="dashboard-bottom"><div className="soft-card categories-card"><div className="card-heading"><h3>Категории шаблона</h3><IconSettings size={17} /></div>{categories.map(([label, value, color]) => <div className={`category-row ${color}`} key={label}><div><span>{label}</span><strong>{value}%</strong></div><i style={{ width: `${value}%` }}></i></div>)}</div><div className="soft-card top-employees"><div className="card-heading"><h3>Топ сотрудников категории</h3><label className="search-field"><IconSearch size={19} /><input placeholder="Поиск" /></label></div><div className="table-head"><span>Сотрудник</span><span>Кол-во звонков</span><span>Средняя оценка</span></div><div className="employee-line"><IconCrown className="crown" size={22} fill="currentColor" /><strong>Самойленко Даниил</strong><span>1</span><span>100%</span></div></div></div>
  </section>;
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
  return <form className="stereo-format-form" onSubmit={(e) => { e.preventDefault(); save(); }}><div className="stereo-format-section"><label className="stereo-format-field"><span>Стереоформат звонков</span><p>Выберите, в каком канале стереозаписи находятся оператор и клиент. Настройка применяется ко всем входящим звонкам, передаваемым на анализ.</p><select value={current} onChange={(e) => change(e.target.value)}><option value="operator-left">L (Оператор), R (Клиент) (по умолчанию)</option><option value="client-left">L (Клиент), R (Оператор)</option></select></label></div><div className="stereo-format-actions"><button type="submit" className="dark-button">Сохранить</button></div></form>;
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
