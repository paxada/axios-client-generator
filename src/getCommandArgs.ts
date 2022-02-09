import { Command } from 'commander';

export const getCommandArgs = (): {
  extraExportPaths: Array<string>;
  folderName?: string;
  packageName?: string;
  includedRoutes?: Array<string>;
  excludedRoutes?: Array<string>;
  configFile?: string;
  tsConfigPath?: string;
} => {
  const program = new Command();
  program
    .option('-e, --extra-export <paths...>', 'Add extra export paths')
    .option('-fn, --folder-name <string>', 'Package alias in package.json name')
    .option('-ir, --included-route <routes...>', 'Included routes from src/routes')
    .option('-er, --excluded-routes <routes...>', 'Excluded routes from src/routes')
    .option('-pn, --package-name <string>', 'Package name')
    .option('-cf, --config-file <string>', 'Config .json file to generate the route. Default: axiosClient.config.json')
    .option(
      '-tcp, --ts-config-path <string>',
      'tsConfig file path to use to compile the project. Default: tsconfig.json',
    );
  program.parse(process.argv);
  const options = program.opts();
  return {
    extraExportPaths: options['extraExport'],
    packageName: options['packageName'],
    folderName: options['folderName'],
    includedRoutes: options['includedRoutes'],
    excludedRoutes: options['excludedRoutes'],
    configFile: options['configFile'],
    tsConfigPath: options['tsConfig'],
  };
};
