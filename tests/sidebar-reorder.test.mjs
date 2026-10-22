import test from 'node:test';
import assert from 'node:assert/strict';
import { sidebarDragLayout } from '../src/sidebar-reorder.js';

const gap = 2;
const compactRows = Object.freeze([25, 73, 121, 169, 217].map((top) => Object.freeze({ top, height: 46, marginTop: 0, marginBottom: 0 })));
const expandedRows = Object.freeze([
  { top: 25, height: 46, marginTop: 0, marginBottom: 0 },
  { top: 73, height: 84, marginTop: 0, marginBottom: 0 },
  { top: 159, height: 46, marginTop: 0, marginBottom: 0 },
  { top: 225, height: 46, marginTop: 18, marginBottom: 0 },
  { top: 273, height: 46, marginTop: 0, marginBottom: 0 },
].map(Object.freeze));

test('keeping a row in place preserves every position and its insertion slot', () => {
  for (const rows of [compactRows, expandedRows]) {
    for (let index = 0; index < rows.length; index += 1) {
      assert.deepEqual(sidebarDragLayout(rows, index, index, gap), {
        offsets: [0, 0, 0, 0, 0],
        slotTop: rows[index].top,
      });
    }
  }
});

test('moving a row down shifts only the intervening rows upward', () => {
  assert.deepEqual(sidebarDragLayout(compactRows, 1, 3, gap), {
    offsets: [0, 96, -48, -48, 0],
    slotTop: 169,
  });
});

test('moving a row up shifts only the intervening rows downward', () => {
  assert.deepEqual(sidebarDragLayout(compactRows, 3, 1, gap), {
    offsets: [0, 48, 48, -96, 0],
    slotTop: 73,
  });
});

test('first and last slots are valid destinations', () => {
  assert.deepEqual(sidebarDragLayout(compactRows, 0, 4, gap), {
    offsets: [192, -48, -48, -48, -48],
    slotTop: 217,
  });
  assert.deepEqual(sidebarDragLayout(compactRows, 4, 0, gap), {
    offsets: [48, 48, 48, 48, -192],
    slotTop: 25,
  });
});

test('moving expanded Analytics reserves the full parent and submenu height', () => {
  assert.deepEqual(sidebarDragLayout(expandedRows, 1, 3, gap), {
    offsets: [0, 114, -86, -86, 0],
    slotTop: 187,
  });
  assert.deepEqual(sidebarDragLayout(expandedRows, 1, 0, gap), {
    offsets: [86, -48, 0, 0, 0],
    slotTop: 25,
  });
});

test('moving another section past expanded Analytics keeps its submenu space', () => {
  assert.deepEqual(sidebarDragLayout(expandedRows, 4, 1, gap), {
    offsets: [0, 48, 48, 48, -200],
    slotTop: 73,
  });
});

test('Templates carries its 18px separation when moved earlier or later', () => {
  assert.deepEqual(sidebarDragLayout(expandedRows, 3, 1, gap), {
    offsets: [0, 66, 66, -134, 0],
    slotTop: 91,
  });
  assert.deepEqual(sidebarDragLayout(expandedRows, 3, 4, gap), {
    offsets: [0, 0, 0, 48, -66],
    slotTop: 273,
  });
});

test('a first-position Templates margin is not counted twice on the next drag', () => {
  const rows = [
    { top: 43, height: 46, marginTop: 18, marginBottom: 0 },
    { top: 91, height: 46, marginTop: 0, marginBottom: 0 },
    { top: 139, height: 46, marginTop: 0, marginBottom: 0 },
  ];
  assert.deepEqual(sidebarDragLayout(rows, 0, 2, gap), {
    offsets: [96, -66, -66],
    slotTop: 139,
  });
  assert.deepEqual(sidebarDragLayout(rows, 1, 0, gap), {
    offsets: [48, -66, 0],
    slotTop: 25,
  });
});
