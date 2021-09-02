import { camelCase } from 'change-case';
import * as _ from 'lodash';
import { relative } from 'path';
import { RouteData } from './type';

export const getRoutePath = (routeFilePath: string): string => {
  const splitted = routeFilePath.split('/');
  splitted.pop();
  return splitted.join('/');
};

export type RouteInterfaces = {
  pathInterface?: string;
  queryInterface?: string;
  bodyInterface?: string;
  responsesInterfaces?: Array<string>;
};

export const extractRouteInterfaces = (fileContent: string): RouteInterfaces => {
  const pathInterfaceRegex = new RegExp(/\w*Path/);
  const queryInterfaceRegex = new RegExp(/\w*Query/);
  const bodyInterfaceRegex = new RegExp(/\w*Body/);
  const responseInterfaceRegex = new RegExp(/\w*Response\d*/g);
  return {
    pathInterface: fileContent.match(pathInterfaceRegex)?.[0],
    queryInterface: fileContent.match(queryInterfaceRegex)?.[0],
    bodyInterface: fileContent.match(bodyInterfaceRegex)?.[0],
    responsesInterfaces: [...fileContent.matchAll(responseInterfaceRegex)].map((results) => results[0]),
  };
};

export const getRouteName = (routePath: string): string => {
  return routePath.split('/').pop();
};

export const getRouteFolders = (routePath: string): Array<string> => {
  return routePath.split('routes/').pop().split('/');
};

export type FolderStuctureObject<T = 'function'> = {
  [key: string]: FolderStuctureObject;
};

export const buildClientObjectFromFolderStructures = async <T>(
  foldersStructure: Array<{
    folders: Array<string>;
    data: T;
  }>,
  fn: (folders: Array<string>, data: T) => Promise<any> = async () => 'function',
): Promise<FolderStuctureObject> => {
  const tree = {};
  for await (const { folders, data } of foldersStructure) {
    let key = folders[0];
    for (let i = 0; i < folders.length; i += 1) {
      const folder = folders[i];
      if (i !== 0) key += `.${camelCase(folder)}`;
      if (!_.get(tree, key)) {
        _.set(tree, key, i === folders.length - 1 ? await fn(folders, data) : {});
      }
    }
  }
  return tree;
};

export const buildRelativeImport = (from: string, to: string) => {
  return relative(from, to).replace('.ts', '');
};

export type ClientTypings = FolderStuctureObject<string>;

export const buildClientTypings = (
  foldersStructure: Array<{
    folders: Array<string>;
    data: RouteData;
  }>,
): Promise<ClientTypings> => {
  return buildClientObjectFromFolderStructures(foldersStructure, async (folders, data) => {
    return data.functionInterfaceName;
  });
};

export const formatClientTypingsString = (clientTypings: ClientTypings): string => {
  const stringified = JSON.stringify(clientTypings).replaceAll('"', '');
  return stringified.slice(1, stringified.length - 1);
};

export type ClientObject = FolderStuctureObject<string>;

export const buildClientObject = (
  foldersStructure: Array<{
    folders: Array<string>;
    data: RouteData;
  }>,
): Promise<ClientObject> => {
  return buildClientObjectFromFolderStructures(foldersStructure, async (folders, data) => {
    return `${data.functionName}(baseParams)`;
  });
};

export const buildClientMock = (
  foldersStructure: Array<{
    folders: Array<string>;
    data: RouteData;
  }>,
): Promise<ClientObject> => {
  return buildClientObjectFromFolderStructures(foldersStructure, async (folders, data) => {
    return 'mockFunction()';
  });
};

export const formatClientObjectString = (clientObject: ClientObject): string => {
  const stringified = JSON.stringify(clientObject).replaceAll('"', '');
  return stringified.slice(1, stringified.length - 1);
};

export const buildTypeImportString = (
  data: Array<{
    functionInterfaceName: string;
    projectSourcePath: string;
    typeFilePath: string;
  }>,
): string => {
  return data
    .map(
      ({ functionInterfaceName, projectSourcePath, typeFilePath }) =>
        `import { ${functionInterfaceName} } from './${buildRelativeImport(projectSourcePath, typeFilePath)}'`,
    )
    .join('\n');
};

export const buildClientImportString = (
  data: Array<{
    functionName: string;
    projectSourcePath: string;
    indexFilePath: string;
  }>,
): string => {
  return data
    .map(
      ({ functionName, projectSourcePath, indexFilePath }) =>
        `import { ${functionName} } from './${buildRelativeImport(projectSourcePath, indexFilePath)}'`,
    )
    .join('\n');
};

export const buildClientExportsString = (
  data: Array<{
    projectSourcePath: string;
    interfaceFilePath: string;
    typeFilePath: string;
  }>,
): string => {
  return data
    .map(({ projectSourcePath, interfaceFilePath, typeFilePath }) => [
      `export * from '${buildRelativeImport(projectSourcePath, interfaceFilePath)}'`,
      `export * from './${buildRelativeImport(projectSourcePath, typeFilePath)}'`,
    ])
    .flat()
    .join('\n');
};

export const interpolateRoutePath = (routePath: string) => {
  const splitted = routePath.split('/');
  return splitted
    .map((entry) => (entry.includes(':') ? `\$\{pathParams.${entry.replace(':', '')}\}` : entry))
    .join('/');
};
