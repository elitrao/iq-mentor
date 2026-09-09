import { useMemo, useState } from "react";
import {
  IconBell,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconDotsVertical,
  IconHeadphones,
  IconPlus,
  IconSearch,
  IconSettings,
  IconSparkles,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { formatRubles } from "./billing/engine.js";
import { BillingSimulator } from "./BillingSimulator.jsx";
import "./account.css";

const QUICK_TOP_UP_AMOUNTS = [1000, 5000, 10000, 15000];
const rubleNumber = new Intl.NumberFormat("ru-RU");

function AccountHeader({ page, profile, setPage, openKnowledge, notify }) {
  const navItems = [
    { id: "account", label: "Главная", onClick: () => setPage("account") },
    { id: "account-tariff", label: "Мой тариф", onClick: () => setPage("account-tariff") },
    { id: "settings", label: "Настройки", onClick: () => setPage("settings") },
    { id: "knowledge", label: "База знаний", onClick: openKnowledge },
  ];

  return <header className="account-header">
    <button className="account-logo" type="button" onClick={() => setPage("account")} aria-label="Главная личного кабинета">
      <img src="/iq-logo.svg" alt="IQ" />
    </button>
    <nav className="account-nav" aria-label="Навигация личного кабинета">
      {navItems.map((item) => <button className={page === item.id || (page === "account-survey" && item.id === "account-tariff") ? "is-active" : ""} type="button" onClick={item.onClick} key={item.id}>{item.label}</button>)}
    </nav>
    <div className="account-header-actions">
      <button className="account-icon-button" type="button" onClick={() => notify("Новых уведомлений нет")} aria-label="Уведомления"><IconBell size={18} stroke={1.6} /></button>
      <button className="account-icon-button" type="button" onClick={() => notify("Открываем поддержку")} aria-label="Поддержка"><IconHeadphones size={18} stroke={1.6} /></button>
      <button className="account-profile" type="button" onClick={() => notify("Профиль пользователя")}>
        <span>{profile.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span>
        <span className="account-profile-copy"><strong>{profile.name}</strong><small>{profile.phone || "+79397106064"}</small></span>
        <IconChevronDown size={16} stroke={1.6} />
      </button>
    </div>
  </header>;
}

function AccountHome({ profile, balanceCents, setPage, notify }) {
  const [query, setQuery] = useState("");
  const employeeVisible = useMemo(() => `${profile.name} ${profile.phone || "+79397106064"}`.toLowerCase().includes(query.trim().toLowerCase()), [profile, query]);

  return <main className="account-home">
    <div className="account-company-row">
      <div className="account-company-title"><span><IconUser size={17} /></span><h1>Компания "{profile.name}"</h1><button type="button" onClick={() => notify("Редактирование компании доступно в настройках")} aria-label="Редактировать компанию"><IconSettings size={18} stroke={1.6} /></button></div>
      <div className="account-balance-actions"><span>Баланс: <strong>{formatRubles(balanceCents)}</strong></span><button className="account-topup-shortcut" type="button" onClick={() => setPage("account-tariff")}><IconPlus size={15} />Пополнить</button><button className="account-history-button" type="button" onClick={() => notify("История операций сохранена в прототипе")} aria-label="История операций"><IconClock size={16} /></button></div>
    </div>

    <section className="account-module-grid" aria-label="Модули компании">
      {[{ id: "analytics", label: "AI Аналитик" }, { id: "trainer", label: "AI Тренер" }].map((module) => <article className="account-module-card" key={module.id}>
        <div className="account-module-meta"><span><IconX size={10} stroke={2.2} />Не подключен</span><button type="button" onClick={() => setPage(module.id)}><IconSettings size={14} />Настроить</button></div>
        <h2>{module.label}</h2>
      </article>)}
      <button className="account-mentor-card" type="button" onClick={() => setPage("home")}>
        <strong>Перейти в IQ Mentor</strong><IconChevronRight size={17} />
      </button>
    </section>

    <section className="account-employees">
      <header><h2>Сотрудники компании</h2><div className="account-employee-actions"><label><IconSearch size={19} stroke={1.5} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по сотрудникам" /></label><button type="button" onClick={() => notify("Приглашение сотрудника создано")}><span>Пригласить</span><IconPlus size={15} /></button></div></header>
      <div className="account-employee-table" role="table" aria-label="Сотрудники компании">
        <div className="account-employee-head" role="row"><span><input type="checkbox" aria-label="Выбрать всех сотрудников" /></span><strong>Сотрудники</strong><strong>Должность</strong><strong>Роль</strong><strong>Статус</strong><strong>Телефон или Email</strong><span /></div>
        {employeeVisible ? <div className="account-employee-row" role="row"><span><input type="checkbox" aria-label={`Выбрать ${profile.name}`} /></span><strong>{profile.name} (Вы)</strong><span>Главный Админ...</span><span><em className="role">Главный администратор</em></span><span><em className="status">Принял заявку</em></span><span>{profile.phone || "+79397106064"}</span><button type="button" onClick={() => notify("Действия сотрудника")} aria-label="Действия сотрудника"><IconDotsVertical size={16} /></button></div> : <div className="account-employee-empty">Сотрудники не найдены</div>}
      </div>
    </section>
  </main>;
}

function AccountTariff({ balanceCents, dispatch, openSurvey, notify }) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const amountRubles = Math.max(0, Math.round(Number(String(amount).replace(/\s/g, "")) || 0));

  const selectAmount = (value) => {
    setAmount(String(value));
    setError("");
  };

  const topUp = () => {
    if (amountRubles < 1000) {
      setError("Минимальная сумма пополнения — 1 000 ₽");
      return;
    }
    dispatch({ type: "TOP_UP", amountCents: amountRubles * 100, success: true });
    setError("");
    notify(`Баланс пополнен на ${rubleNumber.format(amountRubles)} ₽`);
  };

  return <main className="account-tariff-page">
    <header className="account-tariff-heading">
      <h1>Расчет и оплата</h1>
      <div className="account-tariff-balance">
        <span>Баланс: <strong>{formatRubles(balanceCents)}</strong></span>
        <button className="account-tariff-topup" type="button" onClick={() => document.getElementById("account-topup-amount")?.focus()}><IconPlus size={16} />Пополнить</button>
        <button className="account-tariff-history" type="button" onClick={() => notify("История операций сохранена в прототипе")} aria-label="История операций"><IconClock size={16} /></button>
      </div>
    </header>
    <div className="account-payment-grid">
      <section className="account-payment-card">
        <div className="account-payment-copy"><div><h2>Общий баланс</h2><p>Расходуется по фактическому использованию модулей</p></div></div>
        <div className="account-payment-form">
          <label><input id="account-topup-amount" inputMode="numeric" value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^0-9\s]/g, "")); setError(""); }} placeholder="Сумма пополнения" aria-label="Сумма пополнения" /><span>₽</span></label>
          <div className="account-quick-amounts">{QUICK_TOP_UP_AMOUNTS.map((value) => <button className={amountRubles === value ? "is-selected" : ""} type="button" onClick={() => selectAmount(value)} key={value}>{rubleNumber.format(value)} ₽</button>)}</div>
          {error && <p className="account-payment-error" role="alert">{error}</p>}
          <button className="account-payment-submit" type="button" onClick={topUp}>Пополнить баланс</button>
        </div>
      </section>

      <aside className="account-survey-card">
        <span><IconSparkles size={21} stroke={1.7} /></span>
        <h2>Не знаете, сколько пополнить?</h2>
        <p>Ответьте на 3 вопроса — рассчитаем рекомендуемый бюджет AI Аналитика и AI Тренера.</p>
        <button type="button" onClick={openSurvey}>Рассчитать тариф<IconChevronRight size={16} /></button>
      </aside>
    </div>
  </main>;
}

function AccountSurvey({ dispatch, notify }) {
  return <main className="account-survey-page">
    <BillingSimulator
      dispatch={dispatch}
      onConsultation={() => notify("Заявка на консультацию отправлена")}
      startInOnboarding
    />
  </main>;
}

export function AccountPortal({ page, profile, balanceCents, dispatch, setPage, openKnowledge, openSurvey, notify }) {
  return <div className="account-portal">
    <AccountHeader page={page} profile={profile} setPage={setPage} openKnowledge={openKnowledge} notify={notify} />
    {page === "account-tariff" && <AccountTariff balanceCents={balanceCents} dispatch={dispatch} openSurvey={openSurvey} notify={notify} />}
    {page === "account-survey" && <AccountSurvey dispatch={dispatch} notify={notify} />}
    {page === "account" && <AccountHome profile={profile} balanceCents={balanceCents} setPage={setPage} notify={notify} />}
  </div>;
}
