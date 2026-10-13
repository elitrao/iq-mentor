const SETTINGS_ROUTES = new Set(['settings', 'employees']);
const routeName = (route) => route.replace(/^#/, '') || 'home';

export function initialNavigation(hash) {
  const route = routeName(hash);
  return { page: SETTINGS_ROUTES.has(route) ? 'home' : route, settingsOpen: SETTINGS_ROUTES.has(route) };
}

export function navigatePrototype(current, destination) {
  const route = routeName(destination);
  return SETTINGS_ROUTES.has(route)
    ? { ...current, settingsOpen: true }
    : { page: route, settingsOpen: false };
}

export function navigationHash(navigation) {
  return `#${navigation.settingsOpen ? 'settings' : navigation.page}`;
}
