import { join } from 'path';
import { filesMatching } from './files.helpers';

export const getAllRoutesFilePaths = async (): Promise<Array<string>> => {
  return filesMatching(join(process.cwd(), 'src', 'routes', '**/*', '*.route.ts'));
};

export const getRouteInterfaceFilePath = async (routePath: string): Promise<Array<string>> => {
  return filesMatching(join(routePath, '*.interfaces.ts'));
};

export const getRouteDocumentationFilePath = async (routePath: string): Promise<Array<string>> => {
  return filesMatching(join(routePath, '*.doc.ts'));
};

export const getRouteSuccessInterface = (interfaces: Array<string>) => {
  return interfaces.find((response) => {
    const status = +response.match(/\d+/)?.[0];
    return Number.isNaN(status) ? false : status >= 200 && status < 300;
  });
};
