export function sidebarDragLayout(rows, sourceIndex, targetIndex, gap) {
  const order = rows.map((_, index) => index);
  order.splice(targetIndex, 0, order.splice(sourceIndex, 1)[0]);
  const tops = [];
  let top = rows[0].top - rows[0].marginTop;
  for (const index of order) {
    const row = rows[index];
    top += row.marginTop;
    tops[index] = top;
    top += row.height + row.marginBottom + gap;
  }
  return { offsets: rows.map((row, index) => tops[index] - row.top), slotTop: tops[sourceIndex] };
}
