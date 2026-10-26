import { useRef, useState } from "react";
import { IconAlertCircle, IconBulb, IconCheck, IconDots, IconFile, IconUpload, IconX } from "@tabler/icons-react";
import { FeedbackSelect } from "./FeedbackSelect.jsx";
import analystModuleIcon from "./assets/sidebar/analyst.png";
import trainerModuleIcon from "./assets/sidebar/trainer.png";
import "./feedback-page.css";

const FEEDBACK_TYPES = [
  { value: "Проблема / ошибка", icon: IconAlertCircle, tone: "danger" },
  { value: "Предложение / пожелание", icon: IconBulb, tone: "idea" },
  { value: "Другое", icon: IconDots, tone: "neutral" },
];
const PRODUCTS = [
  { value: "Аналитик", image: analystModuleIcon, tone: "analyst" },
  { value: "Тренер", image: trainerModuleIcon, tone: "trainer" },
];
const INITIAL_FORM = { subject: "", type: "", message: "", product: "" };

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

export function FeedbackPage({ customer, notify, title = "Есть вопрос или предложение?", description = "Расскажите нам — мы изучим ваше обращение." }) {
  const inputRef = useRef(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const updateField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const selectFile = (nextFile) => {
    if (!nextFile) return;
    if (nextFile.size > 10 * 1024 * 1024) {
      setFile(null);
      setFileError("Размер файла не должен превышать 10 МБ.");
      return;
    }
    setFile(nextFile);
    setFileError("");
  };
  const handleFileInput = (event) => {
    selectFile(event.target.files?.[0]);
    event.target.value = "";
  };
  const handleDrop = (event) => {
    event.preventDefault();
    setDragActive(false);
    selectFile(event.dataTransfer.files?.[0]);
  };
  const submit = (event) => {
    event.preventDefault();
    const createdAt = new Date();
    const task = {
      id: `SUP-${String(createdAt.getTime()).slice(-6)}`,
      project: "Тех. поддержка и обратная связь",
      company: customer?.company || "IQ Group",
      customerName: customer?.name || "Самойленко Даниил",
      contacts: [customer?.phone, customer?.email].filter(Boolean).join(" · "),
      type: form.type,
      subject: form.subject.trim(),
      message: form.message.trim(),
      product: form.product,
      attachments: file ? [{ name: file.name, size: file.size, type: file.type }] : [],
      clientUrl: `${window.location.origin}${window.location.pathname}#account`,
      createdAt: createdAt.toISOString(),
    };
    try {
      const existing = JSON.parse(localStorage.getItem("iq-mentor-support-tasks") || "[]");
      localStorage.setItem("iq-mentor-support-tasks", JSON.stringify([...existing, task]));
    } catch { /* The prototype success state still works if storage is unavailable. */ }
    setSubmitted(true);
    notify?.("Обращение отправлено");
  };

  if (submitted) return <section className="feedback-page feedback-page-success" aria-live="polite">
    <div className="feedback-success-card">
      <span className="feedback-success-icon"><IconCheck size={28} stroke={2} /></span>
      <h1>Обращение отправлено</h1>
      <p>Спасибо! Мы получили ваше обращение.</p>
    </div>
  </section>;

  const canSubmit = form.subject.trim() && form.type && form.message.trim() && form.product;

  return <section className="feedback-page">
    <div className="feedback-page-inner">
      <header className="feedback-heading">
        <h1>{title}</h1>
        <p>{description}</p>
      </header>

      <form className="feedback-form" onSubmit={submit}>
        <label className="feedback-field">
          <span>Тема обращения <i>*</i></span>
          <input required value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Кратко опишите суть обращения" />
        </label>

        <div className="feedback-field-pair">
          <div className="feedback-field">
            <span>Тип обращения <i>*</i></span>
            <FeedbackSelect label="Тип обращения *" options={FEEDBACK_TYPES} placeholder="Выберите тип обращения" value={form.type} onChange={(value) => updateField("type", value)} />
          </div>

          <div className="feedback-field">
            <span>Продукт <i>*</i></span>
            <FeedbackSelect label="Продукт *" options={PRODUCTS} placeholder="Выберите продукт" value={form.product} onChange={(value) => updateField("product", value)} />
          </div>
        </div>

        <label className="feedback-field">
          <span>Текст обращения <i>*</i></span>
          <textarea required rows="3" value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Расскажите подробнее, что произошло или что хотелось бы улучшить" />
        </label>

        <div className="feedback-field">
          <span>Файл или скриншот <small>необязательно</small></span>
          {file ? <div className="feedback-file">
            <span><IconFile size={19} stroke={1.7} /><span><strong>{file.name}</strong><small>{formatFileSize(file.size)}</small></span></span>
            <button type="button" onClick={() => setFile(null)} aria-label={`Удалить ${file.name}`}><IconX size={17} /></button>
          </div> : <button
            className={dragActive ? "feedback-dropzone active" : "feedback-dropzone"}
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => { event.preventDefault(); setDragActive(true); }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDragActive(false); }}
            onDrop={handleDrop}
          >
            <span><IconUpload size={21} stroke={1.6} /></span>
            <strong>Перетащите файл сюда или <u>выберите на компьютере</u></strong>
            <small>PNG, JPG, PDF или DOCX · до 10 МБ</small>
          </button>}
          <input ref={inputRef} className="feedback-file-input" type="file" tabIndex={-1} accept="image/png,image/jpeg,.pdf,.doc,.docx" onChange={handleFileInput} />
          {fileError && <p className="feedback-file-error" role="alert">{fileError}</p>}
        </div>

        <button className="feedback-submit" type="submit" disabled={!canSubmit}>Отправить обращение</button>
      </form>
    </div>
  </section>;
}
