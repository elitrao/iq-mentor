import { useRef, useState } from "react";
import { IconCheck, IconFile, IconUpload, IconX } from "@tabler/icons-react";
import "./feedback-page.css";

const FEEDBACK_TYPES = ["Проблема / ошибка", "Вопрос", "Предложение / пожелание", "Другое"];
const PRODUCTS = ["AI Аналитик", "AI Тренер", "Личный кабинет", "Интеграции", "Другое"];
const INITIAL_FORM = { subject: "", type: "", message: "", product: "" };

function formatFileSize(size) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

export function FeedbackPage({ customer, notify }) {
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
      project: "Тех.поддержка",
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

  const revealDetails = Boolean(form.subject.trim());
  const canSubmit = revealDetails && form.type && form.message.trim() && form.product;

  return <section className="feedback-page">
    <div className="feedback-hero" aria-hidden="true" />
    <div className="feedback-page-inner">
      <header className="feedback-heading">
        <h1>Есть вопрос или предложение?</h1>
        <p>Расскажите нам — мы изучим ваше обращение.</p>
      </header>

      <form className="feedback-form" onSubmit={submit}>
        <label className="feedback-field">
          <span>Тема обращения <i>*</i></span>
          <input required value={form.subject} onChange={(event) => updateField("subject", event.target.value)} placeholder="Кратко опишите суть обращения" />
        </label>

        <div className={revealDetails ? "feedback-form-reveal open" : "feedback-form-reveal"} aria-hidden={!revealDetails} inert={revealDetails ? undefined : true}>
          <div className="feedback-form-reveal-inner">
            <label className="feedback-field">
              <span>Тип обращения <i>*</i></span>
              <select required value={form.type} onChange={(event) => updateField("type", event.target.value)}>
                <option value="" disabled>Выберите тип обращения</option>
                {FEEDBACK_TYPES.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>

            <label className="feedback-field">
              <span>Текст обращения <i>*</i></span>
              <textarea required rows="6" value={form.message} onChange={(event) => updateField("message", event.target.value)} placeholder="Расскажите подробнее, что произошло или что хотелось бы улучшить" />
            </label>

            <label className="feedback-field">
              <span>Продукт <i>*</i></span>
              <select required value={form.product} onChange={(event) => updateField("product", event.target.value)}>
                <option value="" disabled>Выберите продукт</option>
                {PRODUCTS.map((product) => <option key={product}>{product}</option>)}
              </select>
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
              <input ref={inputRef} className="feedback-file-input" type="file" accept="image/png,image/jpeg,.pdf,.doc,.docx" onChange={handleFileInput} />
              {fileError && <p className="feedback-file-error" role="alert">{fileError}</p>}
            </div>

            <button className="feedback-submit" type="submit" disabled={!canSubmit}>Отправить обращение</button>
          </div>
        </div>
      </form>
    </div>
  </section>;
}
