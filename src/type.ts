import { RouteInterfaces } from './helpers';

export type RouteData = {
  name: string;
  routeFilePath: string;
  interfaceFilePath: string;
  interfaceContent: string;
  interfaces: RouteInterfaces;
  routePath: string;
  folders: Array<string>;
  documentationFilePath: string;
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  functionName: string;
  functionInterfaceName: string;
  generated: {
    folderPath: string;
    typeFileName: string;
    typeFilePath: string;
    indexFileName: string;
    indexFilePath: string;
  };
};

export type ClientMetadata = {
  projectFolder: string;
  srcFolder: string;
  packageVersion: string;
  serviceFolder: string;
  serviceName: string;
  files: {
    requestTypes: {
      absolutePath: string;
      name: string;
    };
    clientTypes: {
      absolutePath: string;
      name: string;
    };
    index: {
      absolutePath: string;
      name: string;
    };
  };
  routes: Array<RouteData>;
};
