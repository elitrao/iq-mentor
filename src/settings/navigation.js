const SETTINGS_ROUTES = new Set(['settings', 'employees']);
const routeName = (route) => route.replace(/^#/, '') || 'home';
const regularPage = (route) => SETTINGS_ROUTES.has(route) ? 'settings' : route;

function backgroundPage(current) {
  const page = regularPage(current.page === 'settings-3' ? current.returnPage : current.page);
  return !page || page === 'settings-2' || page === 'settings-3' ? 'home' : page;
}

export function initialNavigation(hash) {
  return navigatePrototype({ page: 'home' }, hash);
}

export function navigatePrototype(current, destination) {
  const route = routeName(destination);
  if (route === 'settings-2') return { page: backgroundPage(current), settingsModal: true };
  if (route === 'settings-3') return { page: route, returnPage: backgroundPage(current) };
  return { page: regularPage(route) };
}

export function closeSettingsVariant(current) {
  if (current.settingsModal || current.page === 'settings-3') return { page: backgroundPage(current) };
  return current;
}

export function navigationHash(navigation) {
  return navigation.settingsModal ? '#settings-2' : `#${navigation.page}`;
}
