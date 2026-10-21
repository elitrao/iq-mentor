export const STEREO_FORMATS = [
  { value: 'client-left', label: 'L (Клиент), R (Оператор)' },
  { value: 'operator-left', label: 'L (Оператор), R (Клиент)' },
  { value: 'auto', label: 'Автоматическое определение' },
];

export function getStereoFormat(value = {}) {
  if (STEREO_FORMATS.some((option) => option.value === value.format)) return value.format;
  if (value.mode === 'Автоматически') return 'auto';
  return value.left === 'Клиент' ? 'client-left' : 'operator-left';
}

export function setStereoFormat(value, format) {
  if (!STEREO_FORMATS.some((option) => option.value === format)) return value;
  if (format === 'auto') return { ...value, format, mode: 'Автоматически' };
  return {
    ...value, format, mode: 'Стерео',
    left: format === 'operator-left' ? 'Сотрудник' : 'Клиент',
    right: format === 'operator-left' ? 'Клиент' : 'Сотрудник',
  };
}
