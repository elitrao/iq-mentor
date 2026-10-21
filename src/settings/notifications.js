export const NOTIFICATION_EVENTS = {
  analyst: [
    ["submitted", "Звонок отправлен на оценку", false],
    ["analysisComplete", "Анализ звонка завершен", true],
    ["reportPreparing", "Подготовка отчета", true],
    ["reportComplete", "Генерация отчета завершена", true],
  ],
  trainer: [
    ["creationStarted", "Создание тренировки запущено", true],
    ["trainingCreated", "Тренировка создана", true],
    ["trainingAssigned", "Назначена новая тренировка", false],
    ["analysisStarted", "Анализ тренировки запущен", false],
    ["analysisComplete", "Анализ тренировки завершен", false],
    ["reportPreparing", "Подготовка отчета по тренировкам", true],
    ["reportComplete", "Генерация отчета по тренировкам завершена", true],
  ],
};

export function notificationPreference(kind, value, event, channel) {
  const definition = NOTIFICATION_EVENTS[kind]?.find(([key]) => key === event);
  if (!definition || !["display", "sound"].includes(channel)) return false;
  if (channel === "display" && !definition[2]) return false;
  const saved = value?.events?.[event]?.[channel];
  return typeof saved === "boolean" ? saved : true;
}
