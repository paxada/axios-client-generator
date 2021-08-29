import { camelCase, pascalCase } from 'change-case';
import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { getExportedMembersFromFile } from './files.helpers';
import { extractRouteInterfaces, getRouteFolders, getRouteName, getRoutePath } from './helpers';
import { getRouteDocumentationFilePath, getRouteInterfaceFilePath } from './projectParsing';
import { RouteData } from './type';

export const buildRouteData = async (routeFilePath: string, srcFolder: string): Promise<RouteData> => {
  const routePath = getRoutePath(routeFilePath);
  const name = getRouteName(routePath);
  const interfaceFilePath = (await getRouteInterfaceFilePath(routePath))[0];
  const interfaceContent = readFileSync(interfaceFilePath).toString();
  const interfaces = extractRouteInterfaces(interfaceContent);
  const documentationFilePath = (await getRouteDocumentationFilePath(routePath))[0];
  const documentationExportedMembers = getExportedMembersFromFile(documentationFilePath);
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
