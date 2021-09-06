import { join } from 'path';
import { filesMatching } from './files.helpers';

export const getAllRoutesFilePaths = async (
  path: string,
  includedRoutes: Array<string>,
  excludedRoutes: Array<string>,
): Promise<Array<string>> => {
  const routesPath = join(path, 'src', 'routes');
  const allRoutes = await filesMatching(join(routesPath, '**/*', '*.route.ts'));

  // Keep only included routes
  const included = allRoutes.filter((route) => {
    if (includedRoutes.length === 0) return true;
    return includedRoutes.some((includedRoute) => {
      const includedPath = join(routesPath, includedRoute);
      return route.startsWith(includedPath);
    });
  });

  // Remove excluded routes
  return included.filter((route) =>
    excludedRoutes.every((excludedRoute) => {
      const excludedPath = join(routesPath, excludedRoute);
      return !route.startsWith(excludedPath);
    }),
  );
};

export const getRouteInterfaceFilePath = async (routePath: string): Promise<Array<string>> => {
  return filesMatching(join(routePath, '*.interfaces.ts'));
};

export const getRouteDocumentationFilePath = async (routePath: string): Promise<Array<string>> => {
  return filesMatching(join(routePath, '*.doc.ts'));
};

export const getRouteSuccessInterface = (interfaces?: Array<string>) => {
  return interfaces?.find((response) => {
    const status = +response.match(/\d+/)?.[0];
    return Number.isNaN(status) ? false : status >= 200 && status < 300;
  });
};
