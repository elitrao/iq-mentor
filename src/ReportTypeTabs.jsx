import { useLayoutEffect, useRef, useState } from 'react';
import { IconPhone, IconChartBar, IconCategory, IconBarbell } from '@tabler/icons-react';

const ICONS = { calls: IconPhone, summary: IconChartBar, categories: IconCategory, training: IconBarbell };

export function ReportTypeTabs({ items, active, tone, onChange, id }) {
  const tabsRef = useRef(null);
  const tabRefs = useRef({});
  const [highlight, setHighlight] = useState(null);
  useLayoutEffect(() => {
    const measure = () => {
      const tab = tabRefs.current[active];
      if (!tab) return;
      const next = { left: tab.offsetLeft, width: tab.offsetWidth };
      setHighlight((current) => current?.left === next.left && current?.width === next.width ? current : next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(tabsRef.current);
    Object.values(tabRefs.current).forEach((tab) => tab && observer.observe(tab));
    return () => observer.disconnect();
  }, [active]);
  const onKeyDown = (event, index) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length;
    const next = items[nextIndex].id;
    onChange(next);
    tabRefs.current[next]?.focus();
  };
  return <div className="report-type-tabs-scroll">
    <div ref={tabsRef} className="settings-product-tabs" role="tablist" aria-label="Тип отчёта">
      {highlight && <span className={`notification-tab-highlight tone-${tone}`} aria-hidden="true" style={{ width: highlight.width, transform: `translateX(${highlight.left}px)` }} />}
      {items.map((item, index) => {
        const Icon = ICONS[item.reportType];
        return <button type="button" role="tab" key={item.id}
          id={`${id}-tab-${item.id}`} aria-controls={`${id}-panel-${item.id}`} aria-selected={active === item.id}
          ref={(node) => { tabRefs.current[item.id] = node; }} tabIndex={active === item.id ? 0 : -1}
          className={active === item.id ? `active tone-${tone}` : ''}
          onClick={() => onChange(item.id)} onKeyDown={(event) => onKeyDown(event, index)}>
          <Icon size={18} stroke={1.7} aria-hidden="true" />{item.label}
        </button>;
      })}
    </div>
  </div>;
}
