import { Children, cloneElement, Fragment, isValidElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { columnLimits, mergeColumnWidths, readColumnWidths, resizeColumnSnapshot, writeColumnWidths } from './report-column-widths.js';
import './resizable-report-table.css';

function flattened(children) { return Children.toArray(children).flatMap(child => isValidElement(child) && child.type === Fragment ? flattened(child.props.children) : [child]); }
function headerText(children) { return flattened(children).map(child => typeof child === 'string' || typeof child === 'number' ? String(child) : isValidElement(child) && child.type !== 'button' ? headerText(child.props.children) : '').join('').trim(); }
function sameWidths(a, b) { const keys = Object.keys(b); return keys.length === Object.keys(a).length && keys.every(id => Math.abs((a[id] || 0) - b[id]) < .1); }

/** A native table with optional persisted, ID-based column widths. Keep the existing
 * colgroup and a single header row; callers retain ownership of sticky-header CSS. */
export function ResizableReportTable({ columnIds, storageKey, minWidths = {}, maxWidths = {}, disabledColumns = [], fillContainer = false, className = '', style, children, ...tableProps }) {
  const tableRef = useRef(null), dragRef = useRef(null);
  const [stored, setStored] = useState(() => ({ key: storageKey, widths: readColumnWidths(storageKey) }));
  const committed = stored.key === storageKey ? stored.widths : {};
  const committedRef = useRef(committed); committedRef.current = committed;
  const [baseline, setBaseline] = useState({}), [measured, setMeasured] = useState({}), [draft, setDraft] = useState(null), [dragging, setDragging] = useState(null);
  const idsKey = JSON.stringify(columnIds), active = draft || committed;
  const ready = columnIds.every(id => baseline[id] > 0);
  const frozen = ready && columnIds.some(id => active[id] > 0);
  const widths = Object.fromEntries(columnIds.map(id => [id, active[id] || baseline[id] || 0]));
  const totalWidth = columnIds.reduce((sum, id) => sum + widths[id], 0);

  const measure = useCallback(() => {
    const cells = tableRef.current?.tHead?.rows[0]?.cells;
    if (!cells) return {};
    return Object.fromEntries(Array.from(cells).map(cell => [cell.dataset.reportColumnId, Math.round(cell.getBoundingClientRect().width * 100) / 100]).filter(([id, width]) => id && width > 0));
  }, []);
  const finishDrag = useCallback((commit = false) => {
    const session = dragRef.current;
    if (!session) return;
    dragRef.current = null;
    if (session.element.hasPointerCapture?.(session.pointerId)) session.element.releasePointerCapture(session.pointerId);
    if (commit && session.changed) {
      const next = mergeColumnWidths(session.previous, session.latest);
      committedRef.current = next;
      setStored({ key: session.storageKey, widths: next });
      writeColumnWidths(session.storageKey, next);
    }
    setDraft(null); setDragging(null);
  }, []);

  // Measure the untouched responsive table before applying stored pixel widths.
  // This also gives a newly revealed column its own initial width, not its neighbor's.
  useLayoutEffect(() => {
    const update = () => {
      const next = measure();
      setMeasured(current => sameWidths(current, next) ? current : next);
      if (!frozen) setBaseline(current => { const merged = { ...current, ...next }; return sameWidths(current, merged) ? current : merged; });
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    if (tableRef.current) observer?.observe(tableRef.current);
    return () => observer?.disconnect();
  }, [idsKey, frozen, storageKey, measure]);
  useLayoutEffect(() => {
    finishDrag(false);
    if (stored.key !== storageKey) setStored({ key: storageKey, widths: readColumnWidths(storageKey) });
  }, [idsKey, storageKey, finishDrag, stored.key]);
  useEffect(() => {
    if (!dragging) return;
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); finishDrag(false); } };
    const blur = () => finishDrag(false);
    document.addEventListener('keydown', escape, true);
    window.addEventListener('blur', blur);
    return () => { document.removeEventListener('keydown', escape, true); window.removeEventListener('blur', blur); };
  }, [dragging, finishDrag]);
  useEffect(() => () => {
    const session = dragRef.current; dragRef.current = null;
    if (session?.element.hasPointerCapture?.(session.pointerId)) session.element.releasePointerCapture(session.pointerId);
  }, []);

  const reset = () => {
    finishDrag(false); committedRef.current = {};
    setStored({ key: storageKey, widths: {} }); setDraft(null);
    writeColumnWidths(storageKey, {});
  };
  const move = event => {
    const session = dragRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    event.preventDefault(); event.stopPropagation();
    const delta = event.clientX - session.startX;
    if (!session.changed && Math.abs(delta) < 1) return;
    session.latest = resizeColumnSnapshot(session.snapshot, session.id, session.width + delta, session.minWidths, session.maxWidths);
    session.changed = Math.abs(session.latest[session.id] - session.width) > .1;
    setDraft(session.latest);
  };
  const start = (event, id) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || event.isPrimary === false) return;
    event.preventDefault(); event.stopPropagation(); finishDrag(false);
    const snapshot = measure();
    if (!snapshot[id]) return;
    const element = event.currentTarget; element.focus({ preventScroll: true });
    dragRef.current = { id, pointerId: event.pointerId, startX: event.clientX, width: snapshot[id], snapshot, latest: snapshot, previous: committedRef.current, storageKey, changed: false, element, minWidths, maxWidths };
    setDraft(snapshot); setDragging(id);
    element.setPointerCapture(event.pointerId);
  };
  const keyDown = (event, id) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'Escape'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    if (event.key === 'Escape') { finishDrag(false); return; }
    if (event.key === 'Home') { reset(); return; }
    if (dragRef.current) return;
    const snapshot = measure();
    if (!snapshot[id]) return;
    const next = mergeColumnWidths(committedRef.current, resizeColumnSnapshot(snapshot, id, snapshot[id] + (event.key === 'ArrowRight' ? 16 : -16), minWidths, maxWidths));
    committedRef.current = next; setStored({ key: storageKey, widths: next }); writeColumnWidths(storageKey, next);
  };
  const headerRow = row => {
    let index = 0;
    return cloneElement(row, {}, flattened(row.props.children).map(cell => {
      if (!isValidElement(cell) || cell.type !== 'th') return cell;
      const id = columnIds[index++]; if (!id) return cell;
      const disabled = disabledColumns.includes(id), label = headerText(cell.props.children) || cell.props['aria-label'] || id;
      const { min, max } = columnLimits(id, minWidths, maxWidths);
      const value = draft?.[id] || measured[id] || widths[id];
      return cloneElement(cell, { 'data-report-column-id': id, className: `${cell.props.className || ''}${disabled ? '' : ' rrt-resizable-header'}`.trim() }, <>{cell.props.children}{!disabled && <span
        className={`rrt-column-handle${dragging === id ? ' is-dragging' : ''}`} role="separator" tabIndex={0}
        aria-orientation="vertical" aria-label={`Ширина столбца «${label}»`} aria-valuemin={Math.min(min, Math.round(value) || min)} aria-valuemax={Math.max(max, Math.round(value) || max)} aria-valuenow={value ? Math.round(value) : undefined} aria-valuetext={value ? `${Math.round(value)} пикселей` : undefined} aria-keyshortcuts="ArrowLeft ArrowRight Home Escape"
        title="Перетащите, чтобы изменить ширину. Стрелки ← → — 16 px. Двойной щелчок или Home — сбросить ширину всех столбцов. Escape — отменить перетаскивание."
        onPointerDown={event => start(event, id)} onPointerMove={move} onPointerUp={event => { if (dragRef.current?.pointerId !== event.pointerId) return; move(event); finishDrag(true); }} onPointerCancel={event => { if (dragRef.current?.pointerId === event.pointerId) finishDrag(false); }} onLostPointerCapture={event => { if (dragRef.current?.pointerId === event.pointerId) finishDrag(false); }}
        onClick={event => { event.preventDefault(); event.stopPropagation(); }} onDoubleClick={event => { event.preventDefault(); event.stopPropagation(); reset(); }} onKeyDown={event => keyDown(event, id)}
      />}</>);
    }));
  };
  const tableChildren = flattened(children).map(child => {
    if (!isValidElement(child)) return child;
    if (child.type === 'colgroup') {
      let index = 0;
      return cloneElement(child, {}, flattened(child.props.children).map(col => {
        if (!isValidElement(col) || col.type !== 'col') return col;
        const id = columnIds[index++];
        return frozen && widths[id] ? cloneElement(col, { style: { ...col.props.style, width: widths[id] } }) : col;
      }));
    }
    if (child.type === 'thead') return cloneElement(child, {}, flattened(child.props.children).map(row => isValidElement(row) && row.type === 'tr' ? headerRow(row) : row));
    return child;
  });
  // A removed column or a wider viewport must not leave a blank area beside
  // these reports. Native table layout shares the spare width between columns.
  return <table {...tableProps} ref={tableRef} className={`${className} rrt-table${dragging ? ' is-resizing' : ''}`.trim()} style={frozen ? { ...style, width: totalWidth, minWidth: fillContainer ? '100%' : 0, maxWidth: 'none', tableLayout: 'fixed' } : style} data-column-widths={frozen ? 'custom' : 'default'}>{tableChildren}</table>;
}
