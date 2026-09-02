import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { IconArrowLeft, IconArrowUpRight, IconChevronRight, IconSearch, IconSend, IconX } from "@tabler/icons-react";
import "./knowledge-base.css";

const NAV_GROUPS = [["Главная"], ["Кейсы", "Видеоуроки"], ["Аналитик", "Шаблоны", "Сотрудники", "Документы", "Интеграции", "Сценарии применения"]];
const CASES = [
  { id: "training", title: "Обучение менеджеров с помощью AI Тренер", image: "training-case", description: "Первый опыт общения с потенциальными клиентами часто становится испытанием для нового менеджера. AI Тренер позволяет отработать диалог в безопасной среде и подготовиться к реальным звонкам.", steps: ["Выберите сценарий и цель тренировки.", "Проведите тренировочный разговор с AI-клиентом.", "Разберите оценку и рекомендации по каждому этапу диалога.", "Повторите тренировку, уделив внимание сложным моментам."] },
  { id: "hiring", title: "Проверка кандидатов через AI Тренер", image: "hiring-case", description: "Ошибочный найм приводит к дополнительным затратам. Тренировочный диалог помогает увидеть навыки кандидата на практике.", steps: ["Подготовьте одинаковый сценарий для кандидатов.", "Предложите каждому пройти тренировку.", "Сравните результаты по единым критериям."] },
  { id: "sales", title: "Развитие навыков продаж", image: "sales-case", description: "Разбирайте разговоры и превращайте сложные ситуации в персональные тренировки для команды.", steps: ["Найдите точки роста в отчёте по звонкам.", "Выберите соответствующий сценарий тренировки.", "Отслеживайте изменение результатов после практики."] },
];
const ARTICLES = {
  "Видеоуроки": ["Знакомство с AI Аналитиком", "Первая тренировка с AI Тренером", "Как читать отчёт по звонкам"],
  "Аналитик": ["Как загрузить звонки для анализа", "Как настроить критерии оценки", "Как читать отчёт по звонкам"],
  "Шаблоны": ["Создание шаблона оценки", "Настройка этапов разговора", "Использование шаблона в анализе"],
  "Сотрудники": ["Добавление сотрудников", "Создание отделов", "Сравнение результатов команды"],
  "Документы": ["Загрузка документов", "Нормативные документы и звонки", "Контекст и ключевые слова"],
  "Интеграции": ["Подключение Bitrix24", "Подключение amoCRM", "Подключение Яндекс Диска"],
  "Сценарии применения": CASES.map((item) => item.title),
};

function ReferenceCard({ name, label, onClick, className = "", disabled = false }) {
  // These supplied raster cards retain the artwork and embedded copy from the visual reference.
  return <button type="button" className={`kb-image-card ${className}`} onClick={onClick} aria-label={label} disabled={disabled}>
    <img src={`/knowledge/${name}.png`} alt={label} draggable="false" />
  </button>;
}

export function KnowledgeBaseModal({ close, notify }) {
  const dialogRef = useRef(null);
  const contentRef = useRef(null);
  const [section, setSection] = useState("Главная");
  const [article, setArticle] = useState(null);
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  const navigate = (next) => {
    setSection(next);
    setArticle(null);
    setSearch("");
    contentRef.current?.scrollTo(0, 0);
  };
  const openArticle = (item) => {
    setArticle(item);
    contentRef.current?.scrollTo(0, 0);
  };
  const openGuide = (title, module) => openArticle({ title, description: `Краткое знакомство с модулем ${module}.`, steps: module === "AI Аналитик" ? ["Загрузите звонки или подключите интеграцию.", "Выберите шаблон и критерии оценки.", "Запустите анализ и изучите отчёт."] : ["Выберите сценарий разговора.", "Начните тренировку с AI-клиентом.", "Изучите обратную связь и повторите сложные этапы."] });
  const askQuestion = (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    setMessages((current) => [...current, question.trim()]);
    setQuestion("");
  };

  return createPortal(<dialog ref={dialogRef} className="kb-modal" aria-labelledby="kb-title" onCancel={(event) => { event.preventDefault(); close(); }} onClick={(event) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }}>
    <header className="kb-header"><h2 id="kb-title">Помощь</h2><button type="button" className="kb-close" onClick={close} aria-label="Закрыть помощь"><IconX size={13} stroke={1.2} /></button></header>
    <div className="kb-layout">
      <aside className="kb-sidebar">
        <nav aria-label="Разделы базы знаний">{NAV_GROUPS.map((group, index) => <div className="kb-nav-group" key={index}>{group.map((label) => <button type="button" className={section === label ? "kb-nav-link selected" : "kb-nav-link"} key={label} onClick={() => navigate(label)} aria-current={section === label ? "page" : undefined}>{label}</button>)}</div>)}</nav>
        <div className="kb-sidebar-bottom">
          <button type="button" className={`kb-nav-link kb-support${section === "Поддержка" ? " selected" : ""}`} onClick={() => navigate("Поддержка")}>Поддержка<span aria-hidden="true" /></button>
          <ReferenceCard name="chat-banner" label="Новый чат-бот. Спросите о чем угодно. Задать вопрос" onClick={() => navigate("Поддержка")} />
          <ReferenceCard name="telegram-banner" label="Мы в Телеграм. Всё о продукте — понятно и по делу" onClick={() => notify("Ссылка на Telegram пока не подключена")} />
        </div>
      </aside>
      <div className="kb-content" ref={contentRef}>
        {article ? <article className="kb-article">
          <button type="button" className="kb-back" onClick={() => setArticle(null)}><IconArrowLeft size={14} />Назад</button>
          <h3>{article.title}</h3>
          {article.image && <img className="kb-article-image" src={`/knowledge/${article.image}.png`} alt={article.title} />}
          <p>{article.description || "Откройте соответствующий раздел в настройках IQ Mentor, чтобы воспользоваться этой возможностью."}</p>
          {article.steps && <ol>{article.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
        </article> : section === "Главная" ? <>
          <div className="kb-section-heading"><h3>Популярные кейсы<img className="kb-heading-mark" src="/knowledge/cases-mark.png" alt="" /></h3><button type="button" className="kb-all-cases" onClick={() => navigate("Кейсы")}>Посмотреть все кейсы<IconChevronRight size={12} stroke={1.3} /></button></div>
          <div className="kb-featured-grid">
            <ReferenceCard className="kb-featured-main" name="training-case" label={CASES[0].title} onClick={() => openArticle(CASES[0])} />
            <ReferenceCard name="hiring-case" label={CASES[1].title} onClick={() => openArticle(CASES[1])} />
            <ReferenceCard name="sales-case" label={CASES[2].title} onClick={() => openArticle(CASES[2])} />
          </div>
          <section className="kb-onboarding"><h3>Онбординг по ключевым модулям<img className="kb-onboarding-mark" src="/knowledge/onboarding-mark.png" alt="" /></h3><div className="kb-module-grid">
            <ReferenceCard name="analyst-onboarding" label="AI Аналитик. Поднимаем аналитику звонка до космического уровня! 12 минут" onClick={() => openGuide("Знакомство с AI Аналитиком", "AI Аналитик")} />
            <ReferenceCard name="trainer-onboarding" label="AI Тренер. Покажем и расскажем, как учиться на своих ошибках. 7 минут" onClick={() => openGuide("Знакомство с AI Тренером", "AI Тренер")} />
            <ReferenceCard name="crm-onboarding" label="CRM. Скоро появится" disabled />
          </div></section>
          <section className="kb-recommended"><h3>Рекомендуемые статьи</h3>{ARTICLES["Аналитик"].map((title) => <button type="button" key={title} className="kb-article-link" onClick={() => openArticle({ title })}>{title}<IconChevronRight size={14} /></button>)}</section>
        </> : section === "Кейсы" ? <>
          <div className="kb-section-heading"><h3>Кейсы</h3></div><div className="kb-cases-grid">{CASES.map((item) => <div key={item.id}><ReferenceCard name={item.image} label={item.title} onClick={() => openArticle(item)} /><button className="kb-case-title" type="button" onClick={() => openArticle(item)}>{item.title}<IconArrowUpRight size={14} /></button></div>)}</div>
        </> : section === "Поддержка" ? <section className="kb-chat">
          <h3>Поддержка</h3><p>Спросите о возможностях IQ Mentor.</p>
          <div className="kb-chat-messages" aria-live="polite">{messages.length === 0 ? <p>Выберите раздел базы знаний или задайте вопрос.</p> : messages.map((message, index) => <div key={index}><p className="kb-question">{message}</p><p>Это демонстрационный чат, сообщения никуда не отправляются. Попробуйте найти ответ в разделах «Аналитик», «Видеоуроки» или «Сценарии применения».</p></div>)}</div>
          <form className="kb-chat-form" onSubmit={askQuestion}><input aria-label="Ваш вопрос" placeholder="Задайте вопрос" value={question} onChange={(event) => setQuestion(event.target.value)} /><button type="submit" disabled={!question.trim()} aria-label="Отправить вопрос"><IconSend size={17} /></button></form>
        </section> : <section className="kb-directory"><h3>{section}</h3><label className="kb-search"><IconSearch size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти статью" aria-label="Найти статью" /></label>{(ARTICLES[section] || []).filter((title) => title.toLocaleLowerCase("ru").includes(search.toLocaleLowerCase("ru"))).map((title) => <button type="button" key={title} className="kb-article-link" onClick={() => openArticle(CASES.find((item) => item.title === title) || { title })}>{title}<IconChevronRight size={14} /></button>)}{!(ARTICLES[section] || []).some((title) => title.toLocaleLowerCase("ru").includes(search.toLocaleLowerCase("ru"))) && <p className="kb-empty">Статьи не найдены. Попробуйте другой запрос.</p>}</section>}
      </div>
    </div>
  </dialog>, document.body);
}
