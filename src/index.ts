#!/usr/bin/env node
import { exec } from 'child_process';
import { copy, remove } from 'fs-extra';
import { join } from 'path';
import { insert, replaceInFile } from './files.helpers';
import './handlebars.helpers';
import { createFileFromHBS } from './handlebars.helpers';
import {
  buildClientExportsString,
  buildClientImportString,
  buildClientObject,
  buildClientTypings,
  buildRelativeImport,
  buildTypeImportString,
  formatClientObjectString,
  formatClientTypingsString,
  interpolateRoutePath,
} from './helpers';
import { registerModuleAliases } from './moduleAliases.helpers';
import { getAllRoutesFilePaths, getRouteSuccessInterface } from './projectParsing';
import { buildRouteData } from './route.helper';
import { ClientMetadata } from './type';
import { compiledProjectPath, compileTypescriptProject } from './typescript_compiler';
global.require = require;

async function runNpmInstall(path: string) {
  console.log('Executing... npm install');
  return exec(`cd ${path} && npm i`);
}

async function insertProjectName(path: string, projectName: string) {
  const configFiles = [{ path: `${path}/package.json`, value: projectName.toLowerCase() }];
  return Promise.all(
    configFiles.map((configFile) => {
      return replaceInFile(configFile.path, 'projectname', configFile.value);
    }),
  );
}

export const initializeProject = async (path) => {
  console.log('Removing existing client');
  await remove(path);
  console.log('Initializing new client');
  await copy(join(__dirname, 'templates/Project'), path, { overwrite: true });
  const projectName = process.cwd().split('/').pop();
  await insertProjectName(path, projectName);
  await runNpmInstall(path);
};

(async () => {
  console.log('Compiling api');
  const { error } = await compileTypescriptProject();
  if (error) throw new Error(error.message);
  console.log('Registering aliases');
  await registerModuleAliases(join(process.cwd(), 'package.json'));
  console.log('Parsing project');
  const routePaths = await getAllRoutesFilePaths();

  const projectFolder = join(process.cwd(), 'axios-client');
  const srcFolder = join(projectFolder, 'src');
  const clientMetadata: ClientMetadata = {
    projectFolder,
    srcFolder,
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
    },
    routes: await Promise.all(routePaths.map((routeFilePath) => buildRouteData(routeFilePath, srcFolder))),
  };

  const clientTypings = formatClientTypingsString(
    await buildClientTypings(
      clientMetadata.routes.map((route) => ({
        folders: route.folders,
        data: route,
      })),
    ),
  );

  const clientObject = formatClientObjectString(
    await buildClientObject(
      clientMetadata.routes.map((route) => ({
        folders: route.folders,
        data: route,
      })),
    ),
  );

  await initializeProject(clientMetadata.projectFolder);

  const clientImports = buildClientImportString(
    clientMetadata.routes.map((route) => ({
      functionName: route.functionName,
      indexFilePath: route.generated.indexFilePath,
      projectSourcePath: clientMetadata.srcFolder,
    })),
  );
  const clientExports = buildClientExportsString(
    clientMetadata.routes.map((route) => ({
      projectSourcePath: clientMetadata.srcFolder,
      interfaceFilePath: route.interfaceFilePath,
      typeFilePath: route.generated.typeFilePath,
    })),
  );

  const typeImports = buildTypeImportString(
    clientMetadata.routes.map((route) => ({
      functionInterfaceName: route.functionInterfaceName,
      projectSourcePath: clientMetadata.srcFolder,
      typeFilePath: route.generated.typeFilePath,
    })),
  );

  await insert(clientExports).aboveLineContaining('[INSERT EXPORTS]').inFile(clientMetadata.files.index.absolutePath);
  await insert(clientImports).aboveLineContaining('[INSERT IMPORTS]').inFile(clientMetadata.files.index.absolutePath);
  await insert(clientObject).aboveLineContaining('[INSERT CLIENT]').inFile(clientMetadata.files.index.absolutePath);

  await insert(clientTypings)
    .aboveLineContaining('[INSERT CLIENT TYPINGS]')
    .inFile(clientMetadata.files.clientTypes.absolutePath);
  await insert(typeImports)
    .aboveLineContaining('[INSERT CLIENT IMPORTS]')
    .inFile(clientMetadata.files.clientTypes.absolutePath);

  console.log('Creating client methods');
  clientMetadata.routes.forEach((route) => {
    createFileFromHBS({
      templatePath: join(__dirname, 'templates', 'function', 'index.template.hbs'),
      filePath: route.generated.indexFilePath,
      data: {
        routeSuccessInterface: getRouteSuccessInterface(route.interfaces.responsesInterfaces),
        routeInterfaceRelativePath: buildRelativeImport(route.generated.folderPath, route.interfaceFilePath),
        clientTypeRelativePath: buildRelativeImport(
          route.generated.folderPath,
          clientMetadata.files.clientTypes.absolutePath,
        ),
        requestTypeRelativePath: buildRelativeImport(
          route.generated.folderPath,
          clientMetadata.files.requestTypes.absolutePath,
        ),
        functionInterfaceRelativePath: buildRelativeImport(route.generated.folderPath, route.generated.typeFilePath),
        functionInterfaceName: route.functionInterfaceName,
        functionName: route.functionName,
        bodyInterface: route.interfaces.bodyInterface,
        queryInterface: route.interfaces.queryInterface,
        pathParamsInterface: route.interfaces.pathInterface,
        method: route.method.toLocaleLowerCase(),
        hasBody: route.interfaces.bodyInterface,
        hasQuery: route.interfaces.queryInterface,
        hasPathParams: route.interfaces.pathInterface,
        routePath: interpolateRoutePath(route.path),
      },
    });
    createFileFromHBS({
      templatePath: join(__dirname, 'templates', 'function', 'types.template.hbs'),
      filePath: route.generated.typeFilePath,
      data: {
        routeInterfaceRelativePath: buildRelativeImport(route.generated.folderPath, route.interfaceFilePath),
        requestTypeRelativePath: buildRelativeImport(
          route.generated.folderPath,
          clientMetadata.files.requestTypes.absolutePath,
        ),
        functionInterfaceName: route.functionInterfaceName,
        routeSuccessInterface: getRouteSuccessInterface(route.interfaces.responsesInterfaces),
        bodyInterface: route.interfaces.bodyInterface,
        queryInterface: route.interfaces.queryInterface,
        pathParamsInterface: route.interfaces.pathInterface,
        hasBody: route.interfaces.bodyInterface,
        hasQuery: route.interfaces.queryInterface,
        hasPathParams: route.interfaces.pathInterface,
      },
    });
  });
  await remove(compiledProjectPath);
  console.log('Done');
})();
