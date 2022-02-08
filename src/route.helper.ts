import { camelCase, pascalCase } from 'change-case';
import { pathExistsSync, readFileSync } from 'fs-extra';
import { join } from 'path';
import { getExportedMembersFromFile } from './files.helpers';
import { extractRouteInterfaces, getRouteFolders, getRouteName, getRoutePath } from './helpers';
import { getRouteDocumentationFilePath, getRouteInterfaceFilePath } from './projectParsing';
import { RouteData } from './type';

export const buildRouteData = async (routeFilePath: string, srcFolder: string): Promise<RouteData> => {
  const routePath = getRoutePath(routeFilePath);
  const name = getRouteName(routePath);
  const builtInterfaceFilePath = (await getRouteInterfaceFilePath(routePath))[0];
  const interfaceFilePath =
    builtInterfaceFilePath === undefined || pathExistsSync(builtInterfaceFilePath) ? builtInterfaceFilePath : undefined;
  const interfaceContent = interfaceFilePath !== undefined ? readFileSync(interfaceFilePath).toString() : undefined;
  const interfaces = interfaceContent === undefined ? undefined : extractRouteInterfaces(interfaceContent);
  const documentationFilePath = (await getRouteDocumentationFilePath(routePath))[0];
  const documentationExportedMembers = await getExportedMembersFromFile(documentationFilePath);
  const folders = getRouteFolders(routePath);
  const generatedTypeFileName = `${camelCase(name)}.types.ts`;
  const generatedFunctionFileName = `${camelCase(name)}.client.ts`;
  const folderPath = join(srcFolder, ...folders);
  const { route } = documentationExportedMembers;
  return {
    name,
    routeFilePath,
    interfaceFilePath,
    interfaceContent,
    interfaces,
    routePath: getRoutePath(routeFilePath),
    folders,
    documentationFilePath,
    method: route.method,
    path: route.path,
    description: route.description,
    functionName: camelCase(name),
    functionInterfaceName: pascalCase(name),
    generated: {
      folderPath,
      typeFileName: generatedTypeFileName,
      typeFilePath: join(folderPath, generatedTypeFileName),
      indexFileName: generatedFunctionFileName,
      indexFilePath: join(folderPath, generatedFunctionFileName),
    },
  };
};
