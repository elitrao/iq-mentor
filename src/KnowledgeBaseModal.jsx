import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconArrowLeft, IconArrowUpRight, IconBook2, IconBriefcase, IconChevronRight, IconCopy, IconMessageCircle, IconPlayerPlay, IconRefresh, IconSearch, IconSend, IconSparkles, IconThumbDown, IconThumbUp, IconX } from "@tabler/icons-react";
import "./knowledge-base.css";

const NAV_ITEMS = [
  { label: "Кейсы", icon: IconBriefcase },
  { label: "Видеоуроки", icon: IconPlayerPlay },
  { label: "База знаний", icon: IconBook2, external: true },
  { label: "Спросить у ИИ", icon: IconSparkles, separated: true },
  { label: "Написать нам", icon: IconMessageCircle },
];
const CASES = [
  { id: "hiring", title: "Проверка кандидатов через AI Тренер", teaser: "Как подготовить новичков к общению с клиентами...", image: "case-cover-hiring-v2", description: "Ошибочный найм приводит к дополнительным затратам. Тренировочный диалог помогает увидеть навыки кандидата на практике.", steps: ["Подготовьте одинаковый сценарий для кандидатов.", "Предложите каждому пройти тренировку.", "Сравните результаты по единым критериям."] },
  { id: "training", title: "Обучение менеджеров с помощью AI Тренер", teaser: "Как проверить навыки кандидата на практике...", image: "case-cover-training-v2", description: "Первый опыт общения с потенциальными клиентами часто становится испытанием для нового менеджера. AI Тренер позволяет отработать диалог в безопасной среде и подготовиться к реальным звонкам.", steps: ["Выберите сценарий и цель тренировки.", "Проведите тренировочный разговор с AI-клиентом.", "Разберите оценку и рекомендации по каждому этапу диалога.", "Повторите тренировку, уделив внимание сложным моментам."] },
  { id: "promotion", title: "Контроль упоминания акции", teaser: "Почему акции не приносят желаемого результата?...", image: "case-cover-promotion-v2", description: "Проверьте, как менеджеры рассказывают клиентам об акциях и специальных предложениях.", steps: ["Выберите звонки за период акции.", "Проверьте упоминания предложения.", "Сравните результат по сотрудникам."] },
  { id: "quality", title: "Сравнение качества работы менеджеров", teaser: "Почему менеджеры показывают разный результат?...", image: "case-cover-quality-v2", description: "Сравнивайте разговоры по единым критериям и находите практики лучших менеджеров.", steps: ["Выберите команду и период.", "Сопоставьте оценки по ключевым критериям.", "Сформируйте рекомендации для команды."] },
];
const ONBOARDING = [
  { image: "analyst-onboarding-hd", title: "Знакомство с AI Аналитиком", module: "AI Аналитик" },
  { image: "trainer-onboarding-hd", title: "Знакомство с AI Тренером", module: "AI Тренер" },
  { image: "crm-onboarding", title: "Подключение CRM", disabled: true },
];
const VIDEOS = [
  { image: "video-cover-analytics-v2", title: "Аналитика и отчёты", teaser: "Как подготовить новичков к общению с клиентами...", module: "AI Тренер" },
  { image: "video-cover-courses-v2", title: "Создание учебных курсов", teaser: "Как собрать курс из модулей и назначить...", module: "AI Тренер" },
  { image: "video-cover-tests-v2", title: "Конструктор тестов", teaser: "Типы вопросов, настройка баллов и дедлайнов...", module: "AI Тренер" },
  { image: "video-cover-feedback-v2", title: "Обратная связь и менторинг", teaser: "Инструменты коммуникации между наставником...", module: "AI Тренер" },
];
const AI_SUGGESTIONS = [
  { image: "ai-integration", title: "Как привязать Битрикс 24?", subtitle: "Интеграции" },
  { image: "ai-template", title: "Как создать шаблон?", subtitle: "Шаблоны и категории" },
  { image: "ai-report", title: "Как сформировать отчёт?", subtitle: "Прогресс и результаты" },
  { image: "ai-filter", title: "Как работать с фильтрами на дашборде?", subtitle: "Дашборд и метрики" },
];
const DEMO_AI_RESPONSE = `Конечно! Ниже — короткая инструкция, которая поможет быстро разобраться с этим разделом.

1. Откройте нужный модуль в левом меню и выберите рабочий раздел.
2. Проверьте подключённые источники данных и настройки команды.
3. Выберите подходящий шаблон, период и необходимые параметры.
4. Запустите обработку и дождитесь формирования результата.

После этого система соберёт данные в одном окне: покажет основные показатели, проблемные места и рекомендации для дальнейшей работы. Любой отчёт можно открыть подробнее, отфильтровать по сотруднику или периоду и использовать при разборе звонков с командой.

Если результат выглядит неполным, проверьте выбранный период и наличие загруженных звонков. Это демонстрационный ответ — здесь будет отображаться текст из подключённой Базы знаний.`;
const AI_LINKS = new Map([
  ["нужный модуль", "#analytics"],
  ["подключённые источники данных", "#settings"],
  ["подходящий шаблон", "#settings"],
  ["Любой отчёт", "#analytics"],
  ["Базы знаний", "#help"],
]);
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
  return <button type="button" className={`kb-image-card ${className}`} onClick={onClick} aria-label={label} disabled={disabled}>
    <img src={`/knowledge/${name}.png`} alt={label} draggable="false" />
  </button>;
}

function CaseTile({ item, onClick }) {
  return <button type="button" className={`kb-case-tile kb-case-${item.id}`} onClick={onClick}>
    <span className="kb-case-cover"><img src={`/knowledge/${item.image}.png`} alt="" /><i><IconArrowUpRight size={16} /></i></span>
    <strong>{item.title}</strong>
    <small>{item.teaser}</small>
  </button>;
}

function VideoTile({ item, onClick }) {
  return <button type="button" className="kb-video-tile" onClick={onClick}>
    <span className="kb-video-cover"><img src={`/knowledge/${item.image}.png`} alt="" /><i><IconPlayerPlay size={18} fill="currentColor" /></i></span>
    <strong>{item.title}</strong>
    <small>{item.teaser}</small>
  </button>;
}

function renderAiText(text) {
  const linkPattern = new RegExp(`(${[...AI_LINKS.keys()].join("|")})`, "g");
  return text.split(linkPattern).map((part, index) => AI_LINKS.has(part)
    ? <a className="kb-ai-inline-link" href={AI_LINKS.get(part)} onClick={(event) => event.preventDefault()} key={`${part}-${index}`}>{part}</a>
    : part);
}

function renderStreamingAiText(text) {
  const words = text.match(/\S+\s*/g) || [];
  return words.map((word, index) => <span
    className="kb-ai-reveal-word"
    style={{ "--kb-word-delay": `${(index % 4) * 18}ms` }}
    key={`${index}-${word}`}
  >{word}</span>);
}

export function KnowledgeBaseModal({ close, notify }) {
  const dialogRef = useRef(null);
  const contentRef = useRef(null);
  const conversationRef = useRef(null);
  const composerRef = useRef(null);
  const thinkingTimer = useRef(null);
  const typingTimer = useRef(null);
  const feedbackTimer = useRef(null);
  const [section, setSection] = useState("Кейсы");
  const [article, setArticle] = useState(null);
  const [search, setSearch] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [isAnswering, setIsAnswering] = useState(false);
  const [ratings, setRatings] = useState({});
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    contentRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => () => {
    window.clearTimeout(thinkingTimer.current);
    window.clearInterval(typingTimer.current);
    window.clearTimeout(feedbackTimer.current);
  }, []);

  const stopAnswer = () => {
    window.clearTimeout(thinkingTimer.current);
    window.clearInterval(typingTimer.current);
    setIsAnswering(false);
  };

  const navigate = (next) => {
    stopAnswer();
    window.clearTimeout(feedbackTimer.current);
    setFeedbackVisible(false);
    setSection(next);
    setArticle(null);
    setSearch("");
    if (next === "Спросить у ИИ") {
      setMessages([]);
      setQuestion("");
      setRatings({});
      setFeedbackVisible(false);
    }
    contentRef.current?.scrollTo(0, 0);
  };
  const openArticle = (item) => {
    setArticle(item);
    contentRef.current?.scrollTo(0, 0);
  };
  const openGuide = (title, module) => openArticle({ title, description: `Краткое знакомство с модулем ${module}.`, steps: module === "AI Аналитик" ? ["Загрузите звонки или подключите интеграцию.", "Выберите шаблон и критерии оценки.", "Запустите анализ и изучите отчёт."] : ["Выберите сценарий разговора.", "Начните тренировку с AI-клиентом.", "Изучите обратную связь и повторите сложные этапы."] });
  const startAiAnswer = (value) => {
    const prompt = value.trim();
    if (!prompt || isAnswering) return;
    stopAnswer();
    window.clearTimeout(feedbackTimer.current);
    setFeedbackVisible(false);
    setMessages((current) => [...current, { role: "user", text: prompt }, { role: "assistant", text: "", thinking: true }]);
    setQuestion("");
    if (composerRef.current) composerRef.current.style.height = "24px";
    setSection("Спросить у ИИ");
    setIsAnswering(true);
    thinkingTimer.current = window.setTimeout(() => {
      const responseChunks = DEMO_AI_RESPONSE.match(/\S+\s*/g) || [DEMO_AI_RESPONSE];
      let visibleChunks = 0;
      setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, thinking: false } : message));
      typingTimer.current = window.setInterval(() => {
        visibleChunks = Math.min(responseChunks.length, visibleChunks + 4);
        const visibleText = responseChunks.slice(0, visibleChunks).join("");
        setMessages((current) => current.map((message, index) => index === current.length - 1 ? { ...message, text: visibleText, thinking: false } : message));
        if (visibleChunks >= responseChunks.length) {
          window.clearInterval(typingTimer.current);
          setIsAnswering(false);
        }
      }, 115);
    }, 580);
  };

  const askQuestion = (event) => {
    event.preventDefault();
    startAiAnswer(question);
  };

  const updateQuestion = (event) => {
    const field = event.target;
    setQuestion(field.value);
    field.style.height = "24px";
    field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
  };

  const rateAnswer = (index, value) => {
    setRatings((current) => ({ ...current, [index]: value }));
    setFeedbackVisible(false);
    window.clearTimeout(feedbackTimer.current);
    window.requestAnimationFrame(() => {
      setFeedbackVisible(true);
      feedbackTimer.current = window.setTimeout(() => setFeedbackVisible(false), 3600);
    });
  };

  const sendSupportMessage = (event) => {
    event.preventDefault();
    if (!question.trim()) return;
    notify("Сообщение отправлено в поддержку");
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
        <nav aria-label="Разделы помощи">{NAV_ITEMS.map(({ label, icon: Icon, external, separated }) => <button type="button" className={`${section === label ? "kb-nav-link selected" : "kb-nav-link"}${separated ? " separated" : ""}${external ? " external" : ""}`} key={label} onClick={() => navigate(label)} aria-current={section === label ? "page" : undefined}><Icon size={16} stroke={1.5} /><span>{label}</span>{external && <IconArrowUpRight className="kb-nav-arrow" size={14} stroke={1.7} />}</button>)}</nav>
        <div className="kb-sidebar-bottom">
          <ReferenceCard name="chat-banner-hd" label="Новый чат-бот. Спросите о чем угодно. Задать вопрос" onClick={() => navigate("Спросить у ИИ")} />
          <ReferenceCard name="telegram-banner-hd" label="Мы в Телеграм. Всё о продукте — понятно и по делу" onClick={() => notify("Ссылка на Telegram пока не подключена")} />
        </div>
      </aside>
      <div className="kb-content" ref={contentRef} tabIndex="-1">
        {article ? <article className="kb-article">
          <button type="button" className="kb-back" onClick={() => setArticle(null)}><IconArrowLeft size={14} />Назад</button>
          <h3>{article.title}</h3>
          {article.image && <img className="kb-article-image" src={`/knowledge/${article.image}.png`} alt={article.title} />}
          <p>{article.description || "Откройте соответствующий раздел в настройках IQ Mentor, чтобы воспользоваться этой возможностью."}</p>
          {article.steps && <ol>{article.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
        </article> : section === "Кейсы" ? <>
          <form className="kb-ai-prompt" onSubmit={askQuestion}><IconSparkles size={16} /><input aria-label="Задать вопрос чат-боту" placeholder="Задай вопрос чат-боту" value={question} onChange={(event) => setQuestion(event.target.value)} /><button type="submit" disabled={!question.trim()} aria-label="Отправить вопрос"><IconSend size={16} /></button></form>
          <div className="kb-cases-grid">{CASES.map((item) => <CaseTile item={item} key={item.id} onClick={() => openArticle(item)} />)}</div>
          <section className="kb-onboarding">
            <h3>Онбординг</h3>
            <div className="kb-onboarding-grid">{ONBOARDING.map((item) => <ReferenceCard key={item.image} name={item.image} label={item.title} className="kb-onboarding-card" disabled={item.disabled} onClick={() => !item.disabled && openGuide(item.title, item.module)} />)}</div>
          </section>
        </> : section === "Видеоуроки" ? <>
          <form className="kb-ai-prompt" onSubmit={askQuestion}><IconSparkles size={16} /><input aria-label="Задать вопрос чат-боту" placeholder="Задай вопрос чат-боту" value={question} onChange={(event) => setQuestion(event.target.value)} /><button type="submit" disabled={!question.trim()} aria-label="Отправить вопрос"><IconSend size={16} /></button></form>
          <div className="kb-video-grid">{VIDEOS.map((video) => <VideoTile key={video.image} item={video} onClick={() => openGuide(video.title, video.module)} />)}</div>
        </> : section === "Спросить у ИИ" ? <section className={`kb-ai-chat${messages.length ? " has-conversation" : ""}`}>
          {messages.length === 0 ? <>
            <div className="kb-ai-chat-heading"><h3>Задайте свой вопрос по Базе Знаний</h3><p>Быстрое обучение по ключевым функциям системы.<br />Выберите, с чего хотите начать.</p></div>
            <div className="kb-ai-suggestions">{AI_SUGGESTIONS.map((item) => <button type="button" key={item.title} onClick={() => startAiAnswer(item.title)}><img src={`/knowledge/${item.image}.png`} alt="" /><span><strong>{item.title}</strong><small>{item.subtitle}</small></span></button>)}</div>
          </> : <div className="kb-ai-conversation" ref={conversationRef} aria-live="polite">{messages.map((message, index) => message.role === "user" ? <div className="kb-ai-message user" key={index}>{message.text}</div> : <div className="kb-ai-message assistant" key={index}>{message.thinking ? <span className="kb-ai-thinking"><i /><i /><i /></span> : <><p>{isAnswering && index === messages.length - 1 ? renderStreamingAiText(message.text) : renderAiText(message.text)}</p>{!isAnswering && <div className="kb-ai-response-actions"><button type="button" className={ratings[index] === "up" ? "selected" : ""} aria-label="Ответ полезен" aria-pressed={ratings[index] === "up"} onClick={() => rateAnswer(index, "up")}><IconThumbUp size={14} /></button><button type="button" className={ratings[index] === "down" ? "selected" : ""} aria-label="Ответ не помог" aria-pressed={ratings[index] === "down"} onClick={() => rateAnswer(index, "down")}><IconThumbDown size={14} /></button><button type="button" aria-label="Копировать ответ"><IconCopy size={14} /></button><button type="button" aria-label="Повторить ответ"><IconRefresh size={14} /></button></div>}</>}</div>)}</div>}
          <form className="kb-ai-composer" onSubmit={askQuestion}><textarea ref={composerRef} rows="1" aria-label="Сообщение чат-боту" placeholder="Сообщение чат-боту" value={question} onChange={updateQuestion} /><button type="submit" disabled={!question.trim() || isAnswering} aria-label="Отправить вопрос"><IconSend size={15} /></button></form>
          {feedbackVisible && <div className="kb-ai-feedback-toast" role="status"><img src="/knowledge/feedback-bot.png" alt="" /><strong>Ответ оценён, спасибо!</strong></div>}
        </section> : section === "Написать нам" ? <section className="kb-chat">
          <h3>Написать нам</h3><p>Опишите вопрос — команда поддержки поможет разобраться.</p>
          <div className="kb-chat-messages" aria-live="polite"><p>Здесь можно написать команде поддержки. В прототипе сообщение никуда не отправляется.</p></div>
          <form className="kb-chat-form" onSubmit={sendSupportMessage}><input aria-label="Ваш вопрос" placeholder="Задайте вопрос" value={question} onChange={(event) => setQuestion(event.target.value)} /><button type="submit" disabled={!question.trim()} aria-label="Отправить вопрос"><IconSend size={17} /></button></form>
        </section> : <section className="kb-directory"><h3>{section}</h3><label className="kb-search"><IconSearch size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск по статьям" aria-label="Поиск по статьям" /></label>{Object.values(ARTICLES).flat().filter((title) => title.toLocaleLowerCase("ru").includes(search.toLocaleLowerCase("ru"))).map((title) => <button type="button" key={title} className="kb-article-link" onClick={() => openArticle(CASES.find((item) => item.title === title) || { title })}>{title}<IconChevronRight size={14} /></button>)}</section>}
      </div>
    </div>
  </dialog>, document.body);
}
