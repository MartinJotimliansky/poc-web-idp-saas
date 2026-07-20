export type RouteHandler = () => Promise<void>;

const routes: Record<string, RouteHandler> = {};

export function registerRoute(path: string, handler: RouteHandler): void {
  routes[path] = handler;
}

export function getCurrentPath(): string {
  return window.location.pathname;
}

export function getQueryParam(name: string): string | null {
  return new URLSearchParams(window.location.search).get(name);
}

export async function navigate(): Promise<void> {
  const path = getCurrentPath();
  const handler = routes[path];

  if (handler) {
    await handler();
  } else {
    const defaultHandler = routes['/'];
    if (defaultHandler) {
      await defaultHandler();
    } else {
      console.warn(`No hay handler registrado para la ruta: ${path}`);
    }
  }
}
