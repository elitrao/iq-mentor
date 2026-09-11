import { useMemo, useState } from "react";
import {
  IconBell,
  IconChevronDown,
  IconChevronRight,
  IconClock,
  IconDotsVertical,
  IconHeadphones,
  IconInfoCircle,
  IconPlus,
  IconSearch,
  IconSettings,
  IconUser,
  IconX,
} from "@tabler/icons-react";
import { formatRubles } from "./billing/engine.js";
import { BillingSimulator } from "./BillingSimulator.jsx";
import "./account.css";

const rubleNumber = new Intl.NumberFormat("ru-RU");
const MIN_TOP_UP = 25000;
const MAX_TOP_UP = 200000;
const TOP_UP_STEP = 1000;
const PAYMENT_METHODS = [
  { id: "invoice", label: "Безналичный расчет для юрлиц" },
  { id: "card", label: "Банковская карта" },
];
const EMAIL_DOMAINS = ["gmail.com", "yandex.ru", "mail.ru", "vk.com"];

function AccountHeader({ page, profile, setPage, openKnowledge, notify }) {
  const navItems = [
    { id: "account", label: "Главная", onClick: () => setPage("account") },
    { id: "account-tariff", label: "Пополнение баланса", onClick: () => setPage("account-tariff") },
    { id: "settings", label: "Настройки", onClick: () => setPage("settings") },
    { id: "knowledge", label: "Помощь", onClick: openKnowledge },
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

function AccountTariff({ balanceCents, dispatch, notify }) {
  const [amount, setAmount] = useState(MIN_TOP_UP);
  const [email, setEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [hasRequisites, setHasRequisites] = useState(false);
  const [error, setError] = useState("");
  const amountRubles = Math.max(0, Math.round(Number(String(amount).replace(/\s/g, "")) || 0));
  const amountTooLow = String(amount).trim() !== "" && amountRubles < MIN_TOP_UP;
  const selectedMethod = PAYMENT_METHODS.find((method) => method.id === paymentMethod);
  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const requisitesAreReady = paymentMethod === "card" || hasRequisites;
  const canTopUp = amountRubles >= MIN_TOP_UP && emailIsValid && Boolean(paymentMethod) && requisitesAreReady;
  const bonusPoints = Math.floor(amountRubles * 0.01);
  const sliderProgress = ((Math.max(MIN_TOP_UP, Math.min(MAX_TOP_UP, amountRubles)) - MIN_TOP_UP) / (MAX_TOP_UP - MIN_TOP_UP)) * 100;

  const normalizeAmount = (value) => {
    const clamped = Math.max(MIN_TOP_UP, Math.min(MAX_TOP_UP, Number(value) || MIN_TOP_UP));
    return Math.round(clamped / TOP_UP_STEP) * TOP_UP_STEP;
  };

  const updateAmount = (value) => {
    setAmount(value);
    setError("");
  };

  const appendDomain = (domain) => {
    const localPart = email.split("@")[0].trim();
    setEmail(`${localPart}@${domain}`);
  };

  const topUp = () => {
    if (amountRubles < MIN_TOP_UP) {
      setError("Минимальная сумма пополнения — 25 000 ₽");
      return;
    }
    if (!emailIsValid) {
      setError("Укажите корректную почту для чека");
      return;
    }
    if (!paymentMethod) {
      setError("Выберите способ оплаты");
      return;
    }
    if (!requisitesAreReady) {
      setError("Добавьте реквизиты компании");
      return;
    }
    dispatch({ type: "TOP_UP", amountCents: amountRubles * 100, success: true });
    setError("");
    notify(`Баланс пополнен на ${rubleNumber.format(amountRubles)} ₽ · +${rubleNumber.format(bonusPoints)} Б`);
  };

  return <main className="account-tariff-page">
    <header className="account-tariff-heading">
      <h1>Расчет и оплата</h1>
      <div className="account-tariff-balance">
        <span>Баланс: <strong>{formatRubles(balanceCents)}</strong></span>
        <button className="account-tariff-history" type="button" onClick={() => notify("История операций сохранена в прототипе")} aria-label="История операций"><IconClock size={16} /></button>
      </div>
    </header>
    <div className="account-payment-grid">
      <section className="account-topup-card account-amount-card">
        <div className="account-card-title"><h2>Общий баланс</h2><IconInfoCircle size={13} stroke={2} aria-hidden="true" /></div>
        <label className={amountTooLow ? "account-amount-field is-error" : "account-amount-field"}>
          <input
            id="account-topup-amount"
            inputMode="numeric"
            value={rubleNumber.format(amountRubles)}
            onChange={(event) => updateAmount(event.target.value.replace(/\D/g, ""))}
            onBlur={() => setAmount(normalizeAmount(amountRubles))}
            aria-label="Сумма пополнения"
            aria-invalid={amountTooLow}
            aria-describedby={amountTooLow ? "account-amount-minimum" : undefined}
          />
          <span>₽</span>
        </label>
        {amountTooLow && <p className="account-amount-hint" id="account-amount-minimum" role="alert">Минимальная сумма пополнения — 25 000 ₽</p>}
        <input
          className="account-amount-range"
          type="range"
          min={MIN_TOP_UP}
          max={MAX_TOP_UP}
          step={TOP_UP_STEP}
          value={Math.max(MIN_TOP_UP, Math.min(MAX_TOP_UP, amountRubles || MIN_TOP_UP))}
          onChange={(event) => updateAmount(Number(event.target.value))}
          style={{ "--range-progress": `${sliderProgress}%` }}
          aria-label="Сумма пополнения ползунком"
        />
        <div className="account-range-labels" aria-hidden="true"><span>25K</span><span>50K</span><span>100K</span><span>150K</span><span>200K</span></div>
      </section>

      <section className="account-topup-card account-email-card">
        <h2>Почта для чека/счета</h2>
        <label className="account-email-field"><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="E-mail" aria-label="Почта для чека или счета" /></label>
        <div className="account-email-domains">{EMAIL_DOMAINS.map((domain) => <button type="button" onClick={() => appendDomain(domain)} key={domain}>{domain}</button>)}</div>
      </section>

      <section className="account-topup-card account-method-card">
        <h2>Способ оплаты</h2>
        <div className="account-payment-methods">
          {PAYMENT_METHODS.map((method) => <button className={paymentMethod === method.id ? "is-selected" : ""} type="button" onClick={() => { setPaymentMethod(method.id); setError(""); }} key={method.id}>
            <span>{method.label}</span><i aria-hidden="true" />
          </button>)}
        </div>
      </section>

      <section className="account-topup-card account-requisites-card">
        <h2>Реквизиты</h2>
        <button className={hasRequisites ? "is-added" : ""} type="button" onClick={() => { setHasRequisites((value) => !value); setError(""); }}>
          <span><IconPlus size={18} stroke={1.5} /></span>{hasRequisites ? "Реквизиты компании добавлены" : "Добавить реквизиты"}
        </button>
      </section>

      <aside className="account-payment-summary">
        <h2>Информация об оплате</h2>
        <dl>
          <div><dt>Почта</dt><dd>{emailIsValid ? email.trim() : "–"}</dd></div>
          <div><dt>Способ оплаты</dt><dd>{selectedMethod?.label || "–"}</dd></div>
          <div><dt>Реквизиты</dt><dd>{paymentMethod === "card" ? "Не требуются" : hasRequisites ? "Реквизиты компании" : "–"}</dd></div>
        </dl>
        <div className="account-summary-total">
          <strong>{rubleNumber.format(amountRubles)} ₽</strong>
          <span title="Бонус 1% от суммы пополнения">+ {rubleNumber.format(bonusPoints)} Б</span>
        </div>
        <button className="account-payment-submit" type="button" onClick={topUp} aria-disabled={!canTopUp}>Пополнить</button>
        {error && <p className="account-summary-error" role="alert">{error}</p>}
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
    {page === "account-tariff" && <AccountTariff balanceCents={balanceCents} dispatch={dispatch} notify={notify} />}
    {page === "account-survey" && <AccountSurvey dispatch={dispatch} notify={notify} />}
    {page === "account" && <AccountHome profile={profile} balanceCents={balanceCents} setPage={setPage} notify={notify} />}
  </div>;
}
