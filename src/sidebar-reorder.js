export const sidebarGroup = (id) => ['templates', 'documents'].includes(id) ? 'materials' : 'primary';

export function groupSidebarOrder(order) {
  return [...order.filter((id) => sidebarGroup(id) === 'primary'), ...order.filter((id) => sidebarGroup(id) === 'materials')];
}

// Target positions are local to a group. Other groups keep their saved order.
export function moveSidebarItem(order, id, targetIndex) {
  const group = order.filter((item) => sidebarGroup(item) === sidebarGroup(id));
  const from = group.indexOf(id);
  if (from < 0 || !Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= group.length || from === targetIndex) return order;
  group.splice(targetIndex, 0, group.splice(from, 1)[0]);
  let index = 0;
  return order.map((item) => sidebarGroup(item) === sidebarGroup(id) ? group[index++] : item);
}

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
