#!/usr/bin/env node
import { exec } from 'child_process';
import { copy, remove } from 'fs-extra';
import { join } from 'path';
import { insert } from './files.helpers';
import './handlebars.helpers';
import { createFileFromHBS } from './handlebars.helpers';
import {
  buildClientExportsString,
  buildClientImportString,
  buildRelativeImport,
  buildTypeImportString,
  interpolateRoutePath,
} from './helpers';
import { registerModuleAliases } from './moduleAliases.helpers';
import { getRouteSuccessInterface } from './projectParsing';
import { compiledProjectPath, compileTypescriptProject } from './typescript_compiler';
import { addAliasesInTsConfig } from './addAliasesInTsConfig';
import { createExportsString } from './createExportsString';
import { getDepsFromPaths } from './getPeerDepsFromPaths';
import { parseProject } from './parseProject';
import { getCommandArgs } from './getCommandArgs';

global.require = require;

const sleep = (time: number) => new Promise((r) => setTimeout(r, time));

async function runNpmRunPrettify(path: string) {
  console.log('Executing... npm run prettify');
  return exec(`cd ${path} && npm run prettify`);
}

async function runNpmInstall(path: string) {
  console.log('Executing... npm install');
  return exec(`cd ${path} && npm i`);
}

export const initializeProject = async (path) => {
  console.log('Initializing new client');
  await remove(path);
  await copy(join(__dirname, 'templates/project'), path, { overwrite: true });
  await runNpmInstall(path);
};

(async () => {
  const { extraExportPaths, folderName, packageName, configFile, includedRoutes, excludedRoutes } = getCommandArgs();

  console.log('Compiling api');
  const { error } = await compileTypescriptProject();
  if (error) throw new Error(error.message);

  console.log('Registering aliases');
  await registerModuleAliases(process.cwd());

  console.log('Parsing project');
  const clientMetadata = await parseProject({
    folderName,
    packageName,
    excludedRoutes,
    includedRoutes,
    configFile,
    extraExportPaths,
  });

  console.log('Writing ' + clientMetadata.clientFolder);
  await initializeProject(clientMetadata.clientFolder);

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
      interfaceFilePath: route?.interfaceFilePath,
      typeFilePath: route.generated.typeFilePath,
    })),
  );

  const extraExports = createExportsString(
    clientMetadata.extraExportPaths.map((path) => ({
      basePath: clientMetadata.srcFolder,
      targetPath: join(clientMetadata.projectFolder, path),
    })),
  );
  const extraExportsDeps = getDepsFromPaths(
    clientMetadata.projectFolder,
    clientMetadata.extraExportPaths.map((path) => join(clientMetadata.projectFolder, path)),
  );

  const typeImports = buildTypeImportString(
    clientMetadata.routes.map((route) => ({
      functionInterfaceName: route.functionInterfaceName,
      projectSourcePath: clientMetadata.srcFolder,
      typeFilePath: route.generated.typeFilePath,
    })),
  );

  const entitiesInterfacesExports = createExportsString(
    clientMetadata.entityInterfacesPaths.map((path) => ({
      basePath: clientMetadata.srcFolder,
      targetPath: path,
    })),
  );

  await insert(entitiesInterfacesExports)
    .aboveLineContaining('[INSERT EXPORTS]')
    .inFile(clientMetadata.files.index.absolutePath);
  await insert(clientExports).aboveLineContaining('[INSERT EXPORTS]').inFile(clientMetadata.files.index.absolutePath);
  await insert(extraExports).aboveLineContaining('[INSERT EXPORTS]').inFile(clientMetadata.files.index.absolutePath);

  await insert(clientImports)
    .aboveLineContaining('[INSERT IMPORTS]')
    .inFile(clientMetadata.files.requests.absolutePath);
  await insert(clientMetadata.clientObject)
    .aboveLineContaining('[INSERT CLIENT]')
    .inFile(clientMetadata.files.requests.absolutePath);

  await insert(clientMetadata.clientTypings)
    .aboveLineContaining('[INSERT CLIENT TYPINGS]')
    .inFile(clientMetadata.files.clientTypes.absolutePath);
  await insert(typeImports)
    .aboveLineContaining('[INSERT CLIENT IMPORTS]')
    .inFile(clientMetadata.files.clientTypes.absolutePath);

  console.log('Add aliases tsconfig.json');
  addAliasesInTsConfig({
    projectFolderPath: clientMetadata.clientFolder,
    srcPath: clientMetadata.srcFolder,
  });

  console.log('Creating package.json');
  createFileFromHBS({
    templatePath: join(__dirname, 'templates', 'function', 'package.json.template.hbs'),
    data: {
      version: clientMetadata.packageVersion,
      packageName: clientMetadata.packageName,
      folderName: clientMetadata.folderName,
      extraExportsDeps,
    },
    filePath: join(clientMetadata.clientFolder, 'package.json'),
  });

  console.log('Creating mock');
  createFileFromHBS({
    templatePath: join(__dirname, 'templates', 'function', 'mock.ts.template.hbs'),
    data: {
      mockedObject: clientMetadata.clientMock,
    },
    filePath: join(clientMetadata.srcFolder, 'mock.ts'),
  });

  console.log('Creating client methods');
  clientMetadata.routes.forEach((route) => {
    createFileFromHBS({
      templatePath: join(__dirname, 'templates', 'function', 'index.template.hbs'),
      filePath: route.generated.indexFilePath,
      data: {
        routeSuccessInterface: getRouteSuccessInterface(route.interfaces?.responsesInterfaces),
        routeInterfaceRelativePath:
          route.interfaceFilePath === undefined
            ? undefined
            : buildRelativeImport(route.generated.folderPath, route.interfaceFilePath),
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
        bodyInterface: route.interfaces?.bodyInterface,
        queryInterface: route.interfaces?.queryInterface,
        pathParamsInterface: route.interfaces?.pathInterface,
        method: route.method.toLocaleLowerCase(),
        hasBody: route.interfaces?.bodyInterface,
        hasQuery: route.interfaces?.queryInterface,
        hasPathParams: route.interfaces?.pathInterface,
        routePath: interpolateRoutePath(route.path),
        shouldHaveDefaultBody: ['put', 'post'].includes(route.method) && !route.interfaces?.bodyInterface,
      },
    });
    createFileFromHBS({
      templatePath: join(__dirname, 'templates', 'function', 'types.template.hbs'),
      filePath: route.generated.typeFilePath,
      data: {
        routeInterfaceRelativePath:
          route.interfaceFilePath === undefined
            ? undefined
            : buildRelativeImport(route.generated.folderPath, route.interfaceFilePath),
        requestTypeRelativePath: buildRelativeImport(
          route.generated.folderPath,
          clientMetadata.files.requestTypes.absolutePath,
        ),
        functionInterfaceName: route.functionInterfaceName,
        routeSuccessInterface:
          route.interfaces === undefined ? undefined : getRouteSuccessInterface(route.interfaces.responsesInterfaces),
        bodyInterface: route.interfaces?.bodyInterface,
        queryInterface: route.interfaces?.queryInterface,
        pathParamsInterface: route.interfaces?.pathInterface,
        hasBody: route.interfaces?.bodyInterface,
        hasQuery: route.interfaces?.queryInterface,
        hasPathParams: route.interfaces?.pathInterface,
        shouldHaveDefaultBody: ['put', 'post'].includes(route.method) && !route.interfaces?.bodyInterface,
      },
    });
  });
  await remove(compiledProjectPath);

  await sleep(2000);

  await runNpmRunPrettify(clientMetadata.clientFolder);

  console.log('Done');
})();
