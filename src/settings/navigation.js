const SETTINGS_ROUTES = new Set(['settings', 'employees']);
const routeName = (route) => route.replace(/^#/, '') || 'home';

export function initialNavigation(hash) {
  const route = routeName(hash);
  return { page: SETTINGS_ROUTES.has(route) ? 'settings' : route };
}

export function navigatePrototype(current, destination) {
  const route = routeName(destination);
  return { page: SETTINGS_ROUTES.has(route) ? 'settings' : route };
}

export function navigationHash(navigation) {
  return `#${navigation.page}`;
}
