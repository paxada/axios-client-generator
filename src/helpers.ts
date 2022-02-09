import { camelCase } from 'change-case';
import * as _ from 'lodash';
import { join, relative } from 'path';
import { AxiosClientConfig, RouteData } from './type';
import { readFileSync } from 'fs-extra';

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
  const pathInterfaceRegex = new RegExp(/(interface|type) (\w+Path)/);
  const queryInterfaceRegex = new RegExp(/(interface|type) (\w+Query)/);
  const bodyInterfaceRegex = new RegExp(/(interface|type) (\w+Body)/);
  const responseInterfaceRegex = new RegExp(/(interface|type) (\w+Response\d*)/g);
  return {
    pathInterface: fileContent.match(pathInterfaceRegex)?.[2],
    queryInterface: fileContent.match(queryInterfaceRegex)?.[2],
    bodyInterface: fileContent.match(bodyInterfaceRegex)?.[2],
    responsesInterfaces: [...fileContent.matchAll(responseInterfaceRegex)].map((results) => results[2]),
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

export const buildClientDocs = (
  foldersStructure: Array<{
    folders: Array<string>;
    data: RouteData;
  }>,
): Promise<ClientTypings> => {
  return buildClientObjectFromFolderStructures(foldersStructure, async (folders, data) => {
    return data.description;
  });
};

export const formatClientTypingsString = (clientTypings: ClientTypings): string => {
  const stringified = JSON.stringify(clientTypings).replace(/"/g, '');
  return stringified.slice(1, stringified.length - 1);
};

export const formatClientDocsString = (
  clientDocs: FolderStuctureObject<string> | string | undefined,
  deep = 0,
): string => {
  if (clientDocs === undefined) return 'unknown';
  if (typeof clientDocs === 'string') return `: *${clientDocs}*`;
  const tabs = Array(deep)
    .fill(null)
    .map((_) => '\t')
    .join('');
  return Object.keys(clientDocs)
    .map((key) => {
      return `\n${tabs}- **${key}**${formatClientDocsString(clientDocs[key], deep + 1)}`;
    })
    .join('');
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
  const stringified = JSON.stringify(clientObject).replace(/"/g, '');
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
    interfaceFilePath?: string;
    typeFilePath: string;
  }>,
): string => {
  return data
    .map(({ projectSourcePath, interfaceFilePath, typeFilePath }) => {
      return [
        ...(interfaceFilePath === undefined
          ? []
          : [`export * from '${buildRelativeImport(projectSourcePath, interfaceFilePath)}'`]),
        `export * from './${buildRelativeImport(projectSourcePath, typeFilePath)}'`,
      ];
    })
    .flat()
    .join('\n');
};

export const interpolateRoutePath = (routePath: string) => {
  const splitted = routePath.split('/');
  return splitted
    .map((entry) => (entry.includes(':') ? `\$\{pathParams.${entry.replace(':', '')}\}` : entry))
    .join('/');
};

export const getAxiosClientConfig = (
  path: string,
  configFile: string = 'axiosClient.config.json',
): AxiosClientConfig => {
  try {
    const rawData = readFileSync(join(path, configFile)).toString();
    const config = JSON.parse(rawData);

    return {
      folderName: 'folderName' in config && typeof config.folderName === 'string' ? config.folderName : undefined,
      packageName: 'packageName' in config && typeof config.packageName === 'string' ? config.packageName : undefined,
      tsConfigPath:
        'tsConfigPath' in config && typeof config.tsConfigPath === 'string' ? config.tsConfigPath : undefined,
      extraExports:
        'extraExports' in config &&
        Array.isArray(config.extraExports) &&
        config.extraExports.every((e) => typeof e === 'string')
          ? config.extraExports
          : undefined,
      includedRoutes:
        'includedRoutes' in config &&
        Array.isArray(config.includedRoutes) &&
        config.includedRoutes.every((e) => typeof e === 'string')
          ? config.includedRoutes
          : undefined,
      excludedRoutes:
        'excludedRoutes' in config &&
        Array.isArray(config.excludedRoutes) &&
        config.excludedRoutes.every((e) => typeof e === 'string')
          ? config.excludedRoutes
          : undefined,
    };
  } catch (e) {
    console.log(`No ${configFile} found at path: ${path}`);
  }
  return {};
};
