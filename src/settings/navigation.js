const SETTINGS_ROUTES = new Set(['settings', 'employees', 'settings-2', 'settings-3']);
const routeName = (route) => route.replace(/^#/, '') || 'home';

function backgroundPage(current) {
  const page = current.page === 'settings-3' ? current.returnPage : current.page;
  return !page || SETTINGS_ROUTES.has(page) || page === 'feedback' ? 'home' : page;
}

export function initialNavigation(hash, saved) {
  return navigatePrototype(saved || { page: 'home' }, hash);
}

export function navigatePrototype(current, destination) {
  const route = routeName(destination);
  if (SETTINGS_ROUTES.has(route)) return { page: backgroundPage(current), settingsModal: true };
  if (route === 'feedback') return { page: backgroundPage(current), feedbackModal: true };
  return { page: route };
}

export function closeNavigationModal(current) {
  if (current.settingsModal || current.feedbackModal || SETTINGS_ROUTES.has(current.page) || current.page === 'feedback') return { page: backgroundPage(current) };
  return current;
}

export function navigationHash(navigation) {
  return navigation.settingsModal ? '#settings' : navigation.feedbackModal ? '#feedback' : `#${navigation.page}`;
}
