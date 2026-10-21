import { useLayoutEffect, useRef, useState } from 'react';

export function DepartmentList({ activeId, children }) {
  const list = useRef(null);
  const [highlight, setHighlight] = useState(null);

  useLayoutEffect(() => {
    const element = list.current;
    const measure = () => {
      const row = [...element.children].find((child) => child.dataset.departmentId === activeId);
      setHighlight((previous) => {
        if (!row) return previous?.visible ? { ...previous, visible: false } : previous;
        const next = { x: row.offsetLeft, y: row.offsetTop, width: row.offsetWidth, height: row.offsetHeight, visible: true };
        return previous && Object.keys(next).every((key) => next[key] === previous[key]) ? previous : next;
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    [...element.children].filter((child) => child.dataset.departmentId).forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [activeId, children]);

  return <div ref={list} className="employee-department-list">
    {highlight && <span aria-hidden="true" className="employee-department-highlight" style={{
      transform: `translate(${highlight.x}px, ${highlight.y}px)`,
      width: highlight.width, height: highlight.height, opacity: highlight.visible ? 1 : 0,
    }} />}
    {children}
  </div>;
}
