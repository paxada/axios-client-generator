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
import { addAliasesInTsConfig } from './addAliasesInTsConfig';
import { getPackageJsonData } from './getPackageJsonData';
import { upgradePackageVersion } from './upgradePackageVersion';
import { Command } from 'commander';
import { checkExistingPaths } from './checkExistingPaths';
import { createExportsString } from './createExportsString';
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

const parseProject = async (folderName?: string): Promise<ClientMetadata> => {
  const routePaths = await getAllRoutesFilePaths();

  const projectFolder = process.cwd();
  const { name: serviceName, author } = getPackageJsonData(projectFolder);

  const finalFolderName = folderName || `${serviceName}-client`;
  const clientFolder = join(projectFolder, finalFolderName);
  const srcFolder = join(clientFolder, 'src');
  const { version: currentPackageVersion } = getPackageJsonData(clientFolder);

  const newPackageVersion = upgradePackageVersion(currentPackageVersion);
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
    },
    clientTypings,
    clientObject,
    routes,
  };
};

const getArgs = (): { extraExportPaths: Array<string>; folderName?: string; packageName?: string } => {
  const program = new Command();
  program
    .option('-e, --extra-export <paths...>', 'Add extra export paths')
    .option('-fn, --folder-name <string>', 'Package alias in package.json name')
    .option('-pn, --package-name <string>', 'Package name');
  program.parse(process.argv);
  const options = program.opts();
  return {
    extraExportPaths: options['extraExport'] === undefined ? [] : options['extraExport'],
    packageName: options['packageName'],
    folderName: options['folderName'],
  };
};

(async () => {
  const { extraExportPaths, folderName, packageName } = getArgs();

  console.log('Compiling api');
  const { error } = await compileTypescriptProject();
  if (error) throw new Error(error.message);

  console.log('Registering aliases');
  await registerModuleAliases(join(process.cwd(), 'package.json'));

  console.log('Parsing project');
  const clientMetadata = await parseProject(folderName);

  console.log('Checking Extra exports');
  const isValidExtraExports = checkExistingPaths(
    extraExportPaths.map((path) => join(clientMetadata.projectFolder, path)),
  );
  if (isValidExtraExports.hasFailed) throw new Error(isValidExtraExports.message);

  console.log('Writing ' + folderName);
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
      interfaceFilePath: route.interfaceFilePath,
      typeFilePath: route.generated.typeFilePath,
    })),
  );

  const extraExports = createExportsString(
    extraExportPaths.map((path) => ({
      basePath: clientMetadata.srcFolder,
      targetPath: join(clientMetadata.projectFolder, path),
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
  await insert(extraExports).aboveLineContaining('[INSERT EXPORTS]').inFile(clientMetadata.files.index.absolutePath);

  await insert(clientImports).aboveLineContaining('[INSERT IMPORTS]').inFile(clientMetadata.files.index.absolutePath);
  await insert(clientMetadata.clientObject)
    .aboveLineContaining('[INSERT CLIENT]')
    .inFile(clientMetadata.files.index.absolutePath);

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
      packageName,
      folderName,
    },
    filePath: join(clientMetadata.clientFolder, 'package.json'),
  });

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

  await sleep(2000);

  await runNpmRunPrettify(clientMetadata.clientFolder);

  console.log('Done');
})();
