import { useMemo, useRef, useState } from "react";
import {
  IconAdjustmentsHorizontal,
  IconBell,
  IconBuilding,
  IconCheck,
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconCopy,
  IconDotsVertical,
  IconFile,
  IconFileText,
  IconFilter,
  IconFolder,
  IconGridDots,
  IconHeadphones,
  IconInfoCircle,
  IconLayoutList,
  IconPlus,
  IconRefresh,
  IconReportAnalytics,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconStarFilled,
  IconTrash,
  IconUpload,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import bitrix24Logo from "./assets/integrations/bitrix24.png";
import amoCrmLogo from "./assets/integrations/amocrm.png";
import yandexDiskLogo from "./assets/integrations/yandex-disk.png";
import profileAvatar from "./assets/settings/profile-avatar.png";
import "./settings-workspace.css";

const PRIMARY_NAV = [
  { id: "personal", label: "Личный кабинет", icon: IconUser },
  { id: "documents", label: "Документы", icon: IconFileText },
  { id: "employees", label: "Сотрудники", icon: IconUsers },
  { id: "notifications", label: "Уведомления", icon: IconBell, divider: true },
  { id: "reports", label: "Автогенерация отчетов", icon: IconReportAnalytics, divider: true },
  { id: "analyst", label: "Аналитик", icon: IconLayoutList, divider: true },
];

const CRM_ENTITIES = [
  { id: "deals", label: "Сделки", tabs: ["Этапы", "Статусы", "Причины поражения", "Дополнительные поля"] },
  { id: "tasks", label: "Задачи", tabs: ["Типы", "Приоритеты", "Метки", "Дополнительные поля"] },
  { id: "leads", label: "Лиды", tabs: ["Этапы", "Статусы", "Причины поражения", "Дополнительные поля"] },
  { id: "companies", label: "Компании", tabs: ["Статусы", "Типы", "Профили деятельности", "Дополнительные поля"] },
  { id: "marketing", label: "Маркетинг", tabs: ["Источники"] },
  { id: "contacts", label: "Контакты", tabs: ["Статусы", "Типы", "Дополнительные поля"] },
];

const CRM_SEED = {
  deals: {
    "Этапы": ["Квалификация не пройдена", "Проведена презентация", "Получена предоплата", "Тест", "Успешно завершена", "Проиграна"],
    "Статусы": ["Есть проблемы", "Есть вопросы", "Все по плану", "Без статуса"],
    "Причины поражения": ["Выбрали конкурента", "Не устроила стоимость", "Отложили решение", "Не удалось связаться"],
    "Дополнительные поля": ["1зсм", "Адрес", "Индекс"],
  },
  tasks: {
    "Типы": ["Личная задача", "Поручение", "E-мейл", "Встреча", "Звонок", "Событие"],
    "Приоритеты": ["Низкий", "Обычный", "Высокий", "Срочный"],
    "Метки": ["В работе", "Важно", "Клиент", "Повторный контакт"],
    "Дополнительные поля": ["Проект", "Ответственный", "Дата контроля"],
  },
  leads: {
    "Этапы": ["Новый", "В работе", "Квалифицирован", "Передан в сделку"],
    "Статусы": ["Холодный", "Теплый", "Горячий", "Закрыт"],
    "Причины поражения": ["Нет потребности", "Неверный контакт", "Не подходит продукт"],
    "Дополнительные поля": ["Регион", "Продукт", "Планируемый бюджет"],
  },
  companies: {
    "Статусы": ["Клиент", "Партнер", "Поставщик", "Неактивна"],
    "Типы": ["ООО", "ИП", "АО", "Самозанятый"],
    "Профили деятельности": ["Профиль 1", "Профиль 2", "Профиль 3", "Профиль 4"],
    "Дополнительные поля": ["ИНН", "Юридический адрес", "Сайт"],
  },
  marketing: { "Источники": ["Наружная реклама", "Посредник", "Блог", "Вебсайт", "Рассылка", "Холодный звонок"] },
  contacts: {
    "Статусы": ["Холодный", "Теплый", "Горячий"],
    "Типы": ["Лицо, принимающее решение", "Контактное лицо", "Партнер"],
    "Дополнительные поля": ["Должность", "День рождения", "Предпочтительный канал связи"],
  },
};

const COLOR_DOTS = ["#f4c915", "#ff9900", "#55a8ec", "#a9395c", "#2ebf58", "#ff4451"];

function Toggle({ checked, onChange, label }) {
  return <label className="fig-settings-toggle" aria-label={label}>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <i />
  </label>;
}

function SettingsNav({ active, setActive, crmEntity, setCrmEntity }) {
  const [crmOpen, setCrmOpen] = useState(true);
  return <aside className="fig-settings-nav" aria-label="Разделы настроек">
    {PRIMARY_NAV.map((item) => {
      const Icon = item.icon;
      return <div className={item.divider ? "fig-settings-nav-divider" : ""} key={item.id}>
        <button className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)} type="button">
          <Icon size={17} stroke={1.7} /><span>{item.label}</span>
        </button>
      </div>;
    })}
    <div className="fig-settings-nav-divider fig-settings-crm">
      <button className={active === "crm" ? "active" : ""} onClick={() => { setCrmOpen((value) => !value); setActive("crm"); }} type="button">
        <IconLayoutList size={17} stroke={1.7} /><span>CRM</span>{crmOpen ? <IconChevronUp className="crm-chevron" size={15} /> : <IconChevronDown className="crm-chevron" size={15} />}
      </button>
      {crmOpen && <div className="fig-settings-crm-links">
        {CRM_ENTITIES.map((entity) => <button className={active === "crm" && crmEntity === entity.id ? "active" : ""} type="button" key={entity.id} onClick={() => { setCrmEntity(entity.id); setActive("crm"); }}>{entity.label}</button>)}
      </div>}
    </div>
    <div className="fig-settings-nav-divider">
      <button className={active === "additional" ? "active" : ""} onClick={() => setActive("additional")} type="button">
        <IconSettings size={17} stroke={1.7} /><span>Дополнительно</span>
      </button>
    </div>
  </aside>;
}

function PersonalSettings({ settings, update, notify }) {
  const [tab, setTab] = useState("personal");
  const [query, setQuery] = useState("");
  const [grid, setGrid] = useState(true);
  const people = Array.from({ length: 8 }, (_, index) => ({
    id: index,
    name: index ? "Константин Константинопольский" : settings.profile.name,
    role: index ? "Главный Администратор" : settings.profile.position,
    phone: index ? "+7 927 896 68 90" : (settings.profile.phone || "+7 939 710 60 64"),
  })).filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));

  return <div className="fig-personal-grid">
    <div className="fig-profile-column">
      <div className="fig-segmented">
        <button className={tab === "personal" ? "active" : ""} onClick={() => setTab("personal")} type="button">Личные данные</button>
        <button className={tab === "company" ? "active" : ""} onClick={() => setTab("company")} type="button">Данные компании</button>
      </div>
      {tab === "personal" ? <>
        <article className="fig-profile-card">
          <img src={profileAvatar} alt="" />
          <h2>{settings.profile.name}</h2>
          <div><span>{settings.profile.phone || "+7 939 710 60 64"}</span><span>{settings.profile.email}</span></div>
        </article>
        <article className="fig-security-card">
          <span>Пароль</span><strong>************</strong>
          <div><span>Двухфакторная аутентификация</span><Toggle label="Двухфакторная аутентификация" checked={settings.security.twoFactor} onChange={(checked) => update((next) => { next.security.twoFactor = checked; })} /></div>
        </article>
      </> : <form className="fig-company-card" onSubmit={(event) => { event.preventDefault(); notify("Данные компании сохранены"); }}>
        <label><span>Название компании</span><input value={settings.company.name} onChange={(event) => update((next) => { next.company.name = event.target.value; })} /></label>
        <label><span>ИНН</span><input value={settings.company.inn} onChange={(event) => update((next) => { next.company.inn = event.target.value.replace(/\D/g, ""); })} placeholder="Введите ИНН" /></label>
        <label><span>Сфера деятельности</span><input value={settings.company.industry} onChange={(event) => update((next) => { next.company.industry = event.target.value; })} /></label>
        <button type="submit">Сохранить</button>
      </form>}
    </div>
    <section className="fig-company-people">
      <header><h2>Сотрудники компании</h2><div>
        <label><IconSearch size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по сотрудникам" /></label>
        <button className={!grid ? "active" : ""} onClick={() => setGrid(false)} aria-label="Список" type="button"><IconLayoutList size={19} /></button>
        <button className={grid ? "active" : ""} onClick={() => setGrid(true)} aria-label="Плитка" type="button"><IconGridDots size={19} /></button>
        <button className="fig-primary-button" onClick={() => notify("Приглашение сотрудника создано")} type="button"><IconPlus size={18} />Пригласить</button>
      </div></header>
      <div className={grid ? "fig-people-grid" : "fig-people-list"}>{people.map((person) => <article key={person.id}>
        <button aria-label="Действия сотрудника" type="button"><IconDotsVertical size={16} /></button>
        <h3>{person.name}</h3><small>{person.role}</small><span>{person.phone}</span><em>Принял заявку</em>
      </article>)}</div>
    </section>
  </div>;
}

function DocumentsSettings({ notify }) {
  const [type, setType] = useState("Нормативные документы");
  const [files, setFiles] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [keyword, setKeyword] = useState("");
  const inputRef = useRef(null);
  const addKeyword = () => {
    const value = keyword.trim();
    if (!value || keywords.length >= 8 || keywords.includes(value)) return;
    setKeywords((current) => [...current, value]); setKeyword(""); notify("Ключевое слово добавлено");
  };
  return <div className="fig-documents-grid">
    <div className="fig-documents-main">
      <article className="fig-card fig-document-type"><label><span>Выберите формат документов</span><select value={type} onChange={(event) => setType(event.target.value)}><option>Нормативные документы</option><option>Скрипты продаж</option><option>Инструкции</option></select></label><button type="button" onClick={() => setType(type === "Нормативные документы" ? "Скрипты продаж" : "Нормативные документы")}><IconRefresh size={18} />Сменить тип</button></article>
      <article className="fig-card fig-file-card">
        <header><div><h3>Загруженные файлы</h3><p>Загрузите скрипты продаж, стандарты обслуживания и инструкции. ИИ проанализирует документы, выделит обязательные этапы диалога и создаст персональные категории для анализа.</p></div><button disabled={!files.length} type="button"><IconUpload size={18} />Загрузить файлы</button></header>
        <input hidden multiple ref={inputRef} type="file" onChange={(event) => setFiles([...event.target.files].slice(0, 5))} />
        <button className="fig-dropzone" onClick={() => inputRef.current?.click()} type="button"><strong><IconFile size={20} /><span>Выберите</span> или перетащите файлы</strong><small>Поддерживаются форматы: PDF/TXT/DOCX/XLSX<br />Размер каждого файла — не более 4 МБ.</small></button>
        {files.length > 0 && <div className="fig-file-list">{files.map((file) => <span key={file.name}><IconFile size={16} />{file.name}</span>)}</div>}
      </article>
    </div>
    <aside className="fig-documents-side">
      <article className="fig-card fig-context-card"><div><IconFile size={34} /><span>Нет файла</span></div><section><em>Не используется</em><h3>Контекст</h3><p>Свод правил из ваших документов и стандартов. Используйте файл как основу для генерации категорий оценки.</p><button disabled type="button"><IconSparkles size={17} />Категории</button></section></article>
      <article className="fig-card fig-keywords-card"><header><div><h3>Ключевые слова</h3><p>Ключевые слова — это короткие фразы, по которым клиенты находят ваш товар или услугу. Например: «велосипед», «доставка», «ремонт».</p></div><span>{keywords.length}/8</span></header><label>Введите ключевое слово<div><input value={keyword} onChange={(event) => setKeyword(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addKeyword(); } }} placeholder="Добавить" /><button type="button" onClick={addKeyword}><IconPlus size={17} />Добавить</button></div></label><div className="fig-keyword-list">{keywords.map((word) => <button onClick={() => setKeywords((current) => current.filter((item) => item !== word))} type="button" key={word}>{word} ×</button>)}</div><small><IconInfoCircle size={14} />Добавьте от 3 до 8 ключевых слов для лучшего результата</small></article>
    </aside>
  </div>;
}

function EmployeesSettings({ notify }) {
  const [departments, setDepartments] = useState(["Все сотрудники"]);
  const [department, setDepartment] = useState("Все сотрудники");
  const [query, setQuery] = useState("");
  const rows = [
    ["Иванов Иван Иванович", "Все сотрудники", "Bitrix24", "Стандартный", "Не применимо"],
    ["Иванов Иван Иванович", "Все сотрудники", "IQ MENTOR", "Стандартный", "Администратор"],
  ].filter((row) => row[0].toLowerCase().includes(query.toLowerCase()));
  return <div className="fig-employees-page">
    <div className="fig-employees-actions"><button type="button" onClick={() => notify("Дубли не найдены")}><IconUsers size={17} />Поиск дублей</button><button className="fig-dark-button" type="button" onClick={() => { setDepartments((current) => [...current, `Новый отдел ${current.length}`]); notify("Отдел создан"); }}><IconPlus size={18} />Создать отдел</button></div>
    <div className="fig-employees-layout"><aside className="fig-departments"><header>Список отделов компании <IconAdjustmentsHorizontal size={16} /></header><label><IconSearch size={17} /><input placeholder="Поиск по отделам" /></label>{departments.map((name) => <button className={department === name ? "active" : ""} onClick={() => setDepartment(name)} type="button" key={name}><strong>{name}</strong><small>{name === "Все сотрудники" ? "2 сотрудника" : "Нет сотрудников"}</small></button>)}<button className="fig-create-department" type="button" onClick={() => { setDepartments((current) => [...current, `Новый отдел ${current.length}`]); }}><IconPlus size={16} />Нет отделов<small>Создайте свой собственный отдел</small></button><div className="fig-employee-note"><IconInfoCircle size={15} />Добавить/удалить сотрудника можно только в <b>Личном кабинете</b></div></aside>
      <section className="fig-employees-table-wrap"><header><button type="button" aria-label="Фильтр"><IconFilter size={17} /></button><label><IconSearch size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск" /></label><span>На странице по: <b>25</b></span><span>Всего сотрудников: 20</span></header><div className="fig-employees-table"><div className="head"><span /><span>Сотрудники</span><span>Отдел</span><span>Источник</span><span>Привязанный шаблон</span><span>Роль</span><span /></div>{rows.map((row, index) => <div className="row" key={`${row[2]}-${index}`}><input type="checkbox" /><span>{row[0]}</span><span>{row[1]}</span><em className={row[2] === "IQ MENTOR" ? "iq" : "bitrix"}>{row[2]}</em><span>{row[3]}</span><span>{row[4]}</span><button type="button"><IconDotsVertical size={15} /></button></div>)}</div><footer><button>‹</button><button>1</button><button>2</button><button>3</button><button className="active">4</button><span>…</span><button>16</button><button>17</button><button>›</button></footer></section></div>
  </div>;
}

function NotificationSettings({ settings, update }) {
  const [kind, setKind] = useState("analyst");
  const events = kind === "analyst" ? [
    ["all", "Все события", true], ["sent", "Звонок отправлен на оценку", false], ["completed", "Анализ звонка завершен", true], ["preparing", "Подготовка отчета", true], ["generated", "Генерация отчета завершена", true],
  ] : [
    ["all", "Все события", true], ["started", "Тренировка началась", true], ["recommendations", "Получены рекомендации", true], ["progress", "Обновлен прогресс сотрудника", true], ["weekly", "Подготовлен недельный отчет", true],
  ];
  const current = settings.notifications[kind] || {};
  const setValue = (key, channel, checked) => update((next) => {
    next.notifications[kind] ||= {};
    next.notifications[kind][`${key}-${channel}`] = checked;
  });
  const checked = (key, channel) => current[`${key}-${channel}`] ?? (key !== "sent");
  return <section className="fig-notifications-card">
    <div className="fig-product-tabs"><button className={kind === "analyst" ? "active" : ""} onClick={() => setKind("analyst")} type="button">Аналитик</button><button className={kind === "trainer" ? "active" : ""} onClick={() => setKind("trainer")} type="button">Тренер</button></div>
    <div className="fig-notification-row head"><span>Событие</span><span>Отображение</span><span>Звук</span></div>
    {events.map(([key, label, display]) => <div className="fig-notification-row" key={key}><span>{label}</span><span>{display && <Toggle label={`Отображение: ${label}`} checked={checked(key, "display")} onChange={(value) => setValue(key, "display", value)} />}</span><span><Toggle label={`Звук: ${label}`} checked={checked(key, "sound")} onChange={(value) => setValue(key, "sound", value)} /></span></div>)}
  </section>;
}

function ReportsSettings({ settings, update }) {
  const labels = [["day", "Прошлый день"], ["week", "Прошлую неделю"], ["month", "Прошлый месяц"]];
  const periods = settings.reports.autoPeriods || {};
  return <section className="fig-reports-card"><h3>Система будет генерировать отчет за</h3><div>{labels.map(([key, label]) => <article key={key}><Toggle label={label} checked={Boolean(periods[key])} onChange={(checked) => update((next) => { next.reports.autoPeriods ||= {}; next.reports.autoPeriods[key] = checked; })} /><span>{label}</span></article>)}</div></section>;
}

function AnalystSettings({ settings, update, notify }) {
  const [service, setService] = useState("bitrix");
  const services = [
    { id: "bitrix", label: "Bitrix24", logo: bitrix24Logo },
    { id: "yandex", label: "Яндекс Диск", logo: yandexDiskLogo },
    { id: "amo", label: "amoCRM", logo: amoCrmLogo },
  ];
  const selected = services.find((item) => item.id === service);
  const connected = settings.integrations[service]?.connected;
  return <div className="fig-analyst-page">
    <section className="fig-analyst-card"><h3>Интеграции</h3><div className="fig-service-tabs">{services.map((item) => <button className={service === item.id ? "active" : ""} type="button" onClick={() => setService(item.id)} key={item.id}><img src={item.logo} alt="" /><span>{item.label}</span><i className={settings.integrations[item.id]?.connected ? "connected" : ""} /></button>)}</div>
      <div className="fig-integration-description"><header><h4>Интеграция позволяет связать сервис {selected.label} с IQ Mentor</h4><IconChevronUp size={17} /></header><div><article><strong>Новые звонки автоматически добавляются в CRM</strong><p>Фиксируются вызовы, номера, длительность и запись.</p></article><article><strong>Звонки можно привязывать к сделкам, лидам и контактам.</strong><p>Структура сервиса распределяет записи по менеджерам.</p></article><article><strong>Подключение выполняется один раз через ключ-токен</strong><p>После чего интеграция работает автоматически.</p></article></div><footer><label><IconCopy size={16} /><input aria-label="Ключ интеграции" value="••••••••••••••••••••••••" readOnly /></label><button onClick={() => { update((next) => { next.integrations[service].connected = !connected; }); notify(connected ? "Интеграция отключена" : "Интеграция подключена"); }} type="button">{connected ? "Отключить" : "Подключить"}</button><button className="fig-primary-button" type="button" onClick={() => notify("Ключ интеграции обновлен")}>Перегенерировать</button></footer></div>
    </section>
    <section className="fig-analyst-card fig-stereo"><h3>Стереоформат звонков</h3><div><strong>Настройка применяется ко всем входящим звонкам, передаваемым на анализ.</strong><p>Звуки записываются в два отдельных канала: L — левый, R — правый. Укажите, где слышно оператора, а где клиента.</p></div><div className="fig-stereo-fields"><label><b>L</b><select value={settings.stereo.left} onChange={(event) => update((next) => { next.stereo.left = event.target.value; })}><option>Оператор</option><option>Клиент</option></select></label><button type="button" onClick={() => update((next) => { const left = next.stereo.left; next.stereo.left = next.stereo.right; next.stereo.right = left; })}>⇆</button><label><b>R</b><select value={settings.stereo.right} onChange={(event) => update((next) => { next.stereo.right = event.target.value; })}><option>Клиент</option><option>Оператор</option></select></label></div></section>
  </div>;
}

function CrmSettings({ entityId, setEntityId, notify }) {
  const entity = CRM_ENTITIES.find((item) => item.id === entityId) || CRM_ENTITIES[0];
  const [tabs, setTabs] = useState(() => Object.fromEntries(CRM_ENTITIES.map((item) => [item.id, item.tabs[0]])));
  const [data, setData] = useState(CRM_SEED);
  const [query, setQuery] = useState("");
  const tab = entity.tabs.includes(tabs[entityId]) ? tabs[entityId] : entity.tabs[0];
  const values = data[entityId][tab] || [];
  const filtered = values.filter((value) => value.toLowerCase().includes(query.toLowerCase()));
  const isPipeline = tab === "Этапы" && ["deals", "leads"].includes(entityId);
  const noun = tab === "Этапы" ? "этапам" : tab === "Статусы" ? "статусам" : tab === "Типы" ? "типам" : tab === "Источники" ? "типам" : "полям";
  const remove = (value) => setData((current) => ({ ...current, [entityId]: { ...current[entityId], [tab]: current[entityId][tab].filter((item) => item !== value) } }));
  const add = () => { const value = `Новый элемент ${values.length + 1}`; setData((current) => ({ ...current, [entityId]: { ...current[entityId], [tab]: [...current[entityId][tab], value] } })); notify("Элемент добавлен"); };
  return <section className="fig-crm-page">
    <div className="fig-crm-entity-mobile">{CRM_ENTITIES.map((item) => <button className={entityId === item.id ? "active" : ""} onClick={() => setEntityId(item.id)} key={item.id}>{item.label}</button>)}</div>
    <nav className="fig-crm-tabs">{entity.tabs.map((label) => <button className={tab === label ? "active" : ""} onClick={() => { setTabs((current) => ({ ...current, [entityId]: label })); setQuery(""); }} type="button" key={label}>{label}</button>)}</nav>
    <div className={isPipeline ? "fig-crm-panels pipeline" : "fig-crm-panels"}>
      {isPipeline && <article className="fig-crm-panel fig-pipelines"><header><h3>Воронка</h3><button type="button" onClick={() => notify("Воронка добавлена")}><IconPlus size={19} /></button></header><label><IconSearch size={17} /><input placeholder="Поиск по воронкам" /></label>{["Базовая", "Новая созданная", "Тест"].map((name, index) => <div key={name}><span>{name}</span>{index === 0 && <IconStarFilled size={14} />}<button type="button"><IconDotsVertical size={15} /></button></div>)}</article>}
      <article className="fig-crm-panel"><header><h3>{{
        "Этапы": "Этап",
        "Статусы": "Статус",
        "Причины поражения": "Причина поражения",
        "Дополнительные поля": "Поле",
        "Типы": "Тип",
        "Приоритеты": "Приоритет",
        "Метки": "Метка",
        "Профили деятельности": "Профиль деятельности",
        "Источники": "Источник",
      }[tab] || tab}</h3><button type="button" onClick={add}><IconPlus size={19} /></button></header><label><IconSearch size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Поиск по ${noun}`} /></label>{filtered.map((value, index) => <div className="fig-crm-row" key={value}>{!["Дополнительные поля", "Профили деятельности", "Источники"].includes(tab) && <i style={{ backgroundColor: COLOR_DOTS[index % COLOR_DOTS.length] }} />}<span>{value}</span><button onClick={() => remove(value)} type="button" aria-label={`Удалить ${value}`}><IconDotsVertical size={15} /></button></div>)}</article>
    </div>
  </section>;
}

function AdditionalSettings({ settings, update, notify }) {
  const [theme, setTheme] = useState("Светлая");
  const zones = [["12:27", "UTC +2", "Калининград", "Europe/Kaliningrad"], ["13:27", "UTC +3", "Москва, СПБ", "Europe/Moscow"], ["14:27", "UTC +4", "Ижевск, Самара", "Europe/Samara"], ["15:27", "UTC +5", "Екатеринбург", "Asia/Yekaterinburg"]];
  const currentZone = zones.find((item) => item[3] === settings.company.timezone) || zones[2];
  return <div className="fig-additional-page">
    <section className="fig-additional-card"><h3>Тема</h3><div className="fig-theme-options">{["Светлая", "Темная", "Системная"].map((label) => <button className={theme === label ? "active" : ""} type="button" onClick={() => setTheme(label)} key={label}><span>{label}</span><i /></button>)}</div></section>
    <section className="fig-additional-card"><header><h3>Текущие дата и время</h3><button type="button" onClick={() => notify("Время синхронизировано")}><IconClock size={15} />Синхронизировать</button></header><div className="fig-current-time"><strong>{currentZone[0]}, 4 сен 2026 г.</strong><span>{currentZone[1]}</span><span>{currentZone[2]}</span></div></section>
    <section className="fig-additional-card"><header><h3>Часовой пояс</h3><select defaultValue="Регион"><option>Регион</option></select></header><div className="fig-timezones">{zones.map((zone) => <button className={settings.company.timezone === zone[3] ? "active" : ""} type="button" onClick={() => update((next) => { next.company.timezone = zone[3]; })} key={zone[3]}><strong>{zone[0]}</strong><span>{zone[1]}</span><span>{zone[2]}</span></button>)}</div></section>
  </div>;
}

export function SettingsWorkspace({ active, setActive, settings, update, notify }) {
  const [crmEntity, setCrmEntity] = useState("deals");
  const titles = { personal: "Личный кабинет", documents: "Документы", employees: "Сотрудники", notifications: "Уведомления", reports: "Автогенерация отчетов", analyst: "Аналитик", crm: "CRM", additional: "Дополнительно" };
  const safeActive = titles[active] ? active : "personal";
  const content = useMemo(() => {
    if (safeActive === "personal") return <PersonalSettings settings={settings} update={update} notify={notify} />;
    if (safeActive === "documents") return <DocumentsSettings notify={notify} />;
    if (safeActive === "employees") return <EmployeesSettings notify={notify} />;
    if (safeActive === "notifications") return <NotificationSettings settings={settings} update={update} />;
    if (safeActive === "reports") return <ReportsSettings settings={settings} update={update} />;
    if (safeActive === "analyst") return <AnalystSettings settings={settings} update={update} notify={notify} />;
    if (safeActive === "crm") return <CrmSettings entityId={crmEntity} setEntityId={setCrmEntity} notify={notify} />;
    return <AdditionalSettings settings={settings} update={update} notify={notify} />;
  }, [safeActive, settings, update, notify, crmEntity]);

  return <section className="fig-settings-workspace">
    <h1>{titles[safeActive]}</h1>
    <div className="fig-settings-layout">
      <SettingsNav active={safeActive} setActive={setActive} crmEntity={crmEntity} setCrmEntity={setCrmEntity} />
      <main className="fig-settings-content" key={`${safeActive}-${crmEntity}`}>{content}</main>
    </div>
  </section>;
}
