import { ClientMetadata } from './type';
import { getAllRoutesFilePaths } from './projectParsing';
import { getPackageJsonData } from './getPackageJsonData';
import {
  buildClientMock,
  buildClientObject,
  buildClientTypings,
  formatClientObjectString,
  formatClientTypingsString,
  getAxiosClientConfig,
} from './helpers';
import { join } from 'path';
import { upgradePackageVersion } from './upgradePackageVersion';
import { buildRouteData } from './route.helper';

export const parseProject = async (params: {
  folderName?: string;
  packageName?: string;
  extraExportPaths?: Array<string>;
  includedRoutes?: Array<string>;
  excludedRoutes?: Array<string>;
  configFile?: string;
}): Promise<ClientMetadata> => {
  const { excludedRoutes, includedRoutes, configFile, packageName, folderName, extraExportPaths } = params;

  const projectFolder = process.cwd();
  const { name: serviceName, author } = getPackageJsonData(projectFolder);

  const axiosClientConfig = getAxiosClientConfig(projectFolder, configFile || 'axiosClient.config.json');

  const routePaths = await getAllRoutesFilePaths(
    projectFolder,
    includedRoutes || axiosClientConfig.includedRoutes || [],
    excludedRoutes || axiosClientConfig.excludedRoutes || [],
  );

  const finalFolderName = folderName || axiosClientConfig.folderName || `${serviceName}-client`;
  const finalPackageName = packageName || axiosClientConfig.packageName || `${serviceName}-client`;
  const finalExtraExportPaths = extraExportPaths || axiosClientConfig.extraExports || [];

  const clientFolder = join(projectFolder, finalFolderName);
  const srcFolder = join(clientFolder, 'src');
  const { version: currentPackageVersion } = getPackageJsonData(clientFolder);

  const newPackageVersion =
    currentPackageVersion === undefined ? '1.0.0' : upgradePackageVersion(currentPackageVersion);
  const routes = await Promise.all(routePaths.map((routeFilePath) => buildRouteData(routeFilePath, srcFolder)));

  const clientTypings = formatClientTypingsString(
    await buildClientTypings(
      routes.map((route) => ({
        folders: route.folders,
        data: route,
      })),
    ),
  );

  const clientObject = formatClientObjectString(
    await buildClientObject(
      routes.map((route) => ({
        folders: route.folders,
        data: route,
      })),
    ),
  );

  const clientMock = formatClientObjectString(
    await buildClientMock(
      routes.map((route) => ({
        folders: route.folders,
        data: route,
      })),
    ),
  );

  return {
    clientFolder,
    srcFolder,
    packageVersion: newPackageVersion,
    projectFolder,
    folderName: finalFolderName,
    author,
    files: {
      clientTypes: {
        absolutePath: join(srcFolder, 'client.types.ts'),
        name: 'client.types.ts',
      },
      index: {
        absolutePath: join(srcFolder, 'index.ts'),
        name: 'index.ts',
      },
      requestTypes: {
        absolutePath: join(srcFolder, 'request.types.ts'),
        name: 'request.types.ts',
      },
      requests: {
        absolutePath: join(srcFolder, 'getAxiosClient.ts'),
        name: 'getAxiosClient.ts',
      },
    },
    clientTypings,
    clientObject,
    routes,
    clientMock,
    packageName: finalPackageName,
    extraExportPaths: finalExtraExportPaths,
  };
};
