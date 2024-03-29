import { RouteInterfaces } from './helpers';

export type RouteData = {
  name: string;
  routeFilePath: string;
  interfaceFilePath: string;
  interfaceContent?: string;
  interfaces?: RouteInterfaces;
  routePath: string;
  description: string;
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
  clientFolder: string;
  packageName: string;
  srcFolder: string;
  packageVersion: string;
  projectFolder: string;
  folderName: string;
  author: string;
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
    requests: {
      absolutePath: string;
      name: string;
    };
  };
  clientTypings: string;
  clientObject: string;
  routes: Array<RouteData>;
  clientMock: string;
  extraExportPaths: Array<string>;
  entityInterfacesPaths: Array<string>;
  clientDocs: string;
};

export type AxiosClientConfig = {
  folderName?: string;
  packageName?: string;
  extraExports?: Array<string>;
  excludedRoutes?: Array<string>;
  includedRoutes?: Array<string>;
  tsConfigPath?: string;
};
