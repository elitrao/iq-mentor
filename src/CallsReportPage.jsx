import { useEffect, useMemo, useRef, useState } from "react";
import {
  IconCalendar,
  IconChevronRight,
  IconEye,
  IconFilter,
  IconPhone,
  IconSearch,
  IconStarFilled,
  IconX,
} from "@tabler/icons-react";
import avatar1 from "./assets/avatars/employee-1.webp";
import avatar2 from "./assets/avatars/employee-2.webp";
import avatar3 from "./assets/avatars/employee-3.webp";
import "./calls-report.css";

const CALLS = [
  { id: 1, date: "10.06.2026", time: "22:47", employee: "Мария Петрова", avatar: avatar1, client: "ООО Вектор", duration: "23:00", category: "Чек-ап", rating: 74 },
  { id: 2, date: "10.06.2026", time: "15:23", employee: "Иван Смирнов", avatar: avatar2, client: "Альфа Групп", duration: "18:42", category: "Повторный звонок", rating: 95 },
  { id: 3, date: "10.06.2026", time: "12:47", employee: "Мария Петрова", avatar: avatar1, client: "Север", duration: "11:08", category: "Чек-ап", rating: 94 },
  { id: 4, date: "09.06.2026", time: "02:07", employee: "Олег Волков", avatar: avatar3, client: "Компания «Успех»", duration: "07:54", category: "Первичный контакт", rating: 54 },
  { id: 5, date: "09.06.2026", time: "02:07", employee: "Мария Петрова", avatar: avatar1, client: "Бизнес Линия", duration: "16:12", category: "Презентация", rating: 85 },
  { id: 6, date: "08.06.2026", time: "18:31", employee: "Иван Смирнов", avatar: avatar2, client: "Техно Мир", duration: "21:04", category: "Чек-ап", rating: 60 },
  { id: 7, date: "08.06.2026", time: "13:16", employee: "Олег Волков", avatar: avatar3, client: "Оптима", duration: "09:37", category: "Повторный звонок", rating: 90 },
  { id: 8, date: "07.06.2026", time: "17:48", employee: "Мария Петрова", avatar: avatar1, client: "Прайм", duration: "14:26", category: "Чек-ап", rating: 70 },
];

function scoreTone(value) { return value >= 85 ? "good" : value >= 65 ? "medium" : "low"; }

function durationToMinutes(duration) {
  const [minutes, seconds] = duration.split(":").map(Number);
  return minutes + seconds / 60;
}

function humanDate(value) {
  const [day, month, year] = value.split(".").map(Number);
  return new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

function callCode(call) {
  const [day, month, year] = call.date.split(".");
  return `${year}-${month}-${day}-${call.time.replace(":", "-")}-${String(call.id).padStart(2, "0")}`;
}

function CallsChart({ call }) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext("2d"); ctx.scale(ratio, ratio);
    const width = rect.width; const height = rect.height; const left = 38; const bottom = height - 24; const top = 12;
    ctx.clearRect(0, 0, width, height); ctx.font = "10px Inter"; ctx.fillStyle = "#a4aaac";
    for (let i = 0; i <= 6; i += 1) {
      const y = top + ((bottom - top) / 6) * i;
      ctx.strokeStyle = "#e8e9e9"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(left, y); ctx.lineTo(width - 6, y); ctx.stroke();
      ctx.fillText(`${30 - i * 5}:00`, 0, y + 3);
    }
    const selectedDuration = durationToMinutes(call.duration);
    const points = Array.from({ length: 34 }, (_, index) => {
      const wave = Math.sin((index + call.id * 2.3) * .72) * 2.1;
      const drift = ((index % 7) - 3) * .34;
      return Math.max(2, Math.min(29.5, selectedDuration + wave + drift));
    });
    const xStep = (width - left - 6) / (points.length - 1);
    const mapY = (value) => bottom - (value / 30) * (bottom - top);
    const gradient = ctx.createLinearGradient(0, top, 0, bottom); gradient.addColorStop(0, "rgba(238,112,60,.24)"); gradient.addColorStop(1, "rgba(238,112,60,0)");
    ctx.beginPath(); points.forEach((value, index) => { const x = left + index * xStep; const y = mapY(value); if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.lineTo(width - 6, bottom); ctx.lineTo(left, bottom); ctx.closePath(); ctx.fillStyle = gradient; ctx.fill();
    ctx.beginPath(); points.forEach((value, index) => { const x = left + index * xStep; const y = mapY(value); if (!index) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.strokeStyle = "#ee703c"; ctx.lineWidth = 1.4; ctx.stroke();
    ["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].forEach((label, index) => { ctx.fillStyle = "#a4aaac"; ctx.fillText(label, left + index * ((width - left - 22) / 6), height - 5); });
  }, [call]);
  return <canvas className="calls-detail-chart" ref={ref} aria-label="График длительности звонков за неделю" />;
}

function CallDetailsModal({ call, close, selectCall }) {
  const dateLabel = humanDate(call.date);
  const comparison = Math.round((call.rating - 76) * 10) / 10;
  const relatedCalls = [call, ...CALLS.filter((item) => item.id !== call.id)].slice(0, 7);
  return <div className="calls-modal-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
    <aside className="calls-detail-modal" role="dialog" aria-modal="true" aria-label="Детали звонка">
      <button className="calls-modal-close" onClick={close} aria-label="Закрыть"><IconX size={20} /></button>
      <header><nav><button className="active">Длительность звонка</button><button>Рейтинг</button></nav><label>{call.date} <IconCalendar size={20} /></label></header>
      <section className="calls-selected-call">
        <img src={call.avatar} alt="" />
        <div><small>Сотрудник</small><strong>{call.employee}</strong></div>
        <div><small>Клиент</small><strong>{call.client}</strong></div>
        <div><small>Категория</small><strong>{call.category}</strong></div>
        <b className={scoreTone(call.rating)}>{call.rating}%</b>
      </section>
      <section className="calls-chart-summary"><span>{dateLabel}, {call.time}</span><div><strong>{call.duration} мин</strong><em className={comparison < 0 ? "down" : ""}>{comparison > 0 ? "+" : ""}{comparison}%</em></div></section>
      <CallsChart call={call} />
      <div className="calls-detail-list">{relatedCalls.map((item) => <button className={call.id === item.id ? "selected" : ""} type="button" onClick={() => selectCall(item)} key={item.id}><i><IconPhone size={24} /></i><span><strong>{callCode(item)} · {item.client} <IconChevronRight size={15} /></strong><small><em>{item.date}</em><em>{item.time}</em><em>{item.duration}</em><em>{item.category}</em></small></span><b className={scoreTone(item.rating)}>{item.rating}%</b></button>)}</div>
    </aside>
  </div>;
}

export function CallsReportPage() {
  const [query, setQuery] = useState("");
  const [selectedCall, setSelectedCall] = useState(null);
  const filtered = useMemo(() => CALLS.filter((call) => `${call.employee} ${call.client} ${call.category}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className="calls-report-page">
    <h1>Отчёт по звонкам</h1>
    <div className="calls-kpis"><article><header>Всего звонков <em className="up">+19,1%</em></header><strong>128</strong><small>за месяц</small></article><article><header>Среднее время звонка <em className="up">+4%</em></header><strong>13:37</strong><small>за месяц</small></article><article><header>Средний рейтинг <em className="down">−5%</em></header><strong>76 <span>/100</span></strong><small>за месяц</small></article></div>
    <section className="calls-table-card"><header><div><button aria-label="Фильтр"><IconFilter size={19} /></button><button aria-label="Настроить видимость"><IconEye size={19} /></button><label><IconSearch size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск" /></label></div><p>На странице по: <b>25</b><span>Всего звонков: 20</span></p></header>
      <div className="calls-table-scroll"><div className="calls-table"><div className="head"><span>Дата и время</span><span>Длительность</span><span>Сотрудник</span><span>Клиент</span><span>Категория</span><span>Рейтинг</span></div>{filtered.map((call) => <button className="row" type="button" onClick={() => setSelectedCall(call)} key={call.id}><span><b>{call.date}</b><small>{call.time}</small></span><span>{call.duration}</span><span className="employee"><img src={call.avatar} alt="" />{call.employee}</span><span>{call.client}</span><span><em>{call.category}</em></span><strong className={scoreTone(call.rating)}>{call.rating}%{call.rating >= 80 && <IconStarFilled size={14} />}</strong></button>)}</div></div>
      <footer><button>‹</button><button className="active">1</button><button>2</button><button>3</button><span>…</span><button>7</button><button>›</button></footer>
    </section>
    {selectedCall && <CallDetailsModal call={selectedCall} close={() => setSelectedCall(null)} selectCall={setSelectedCall} />}
  </section>;
}
