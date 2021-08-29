import { readFileSync } from 'fs-extra';
import { addAliases } from 'module-alias';
import { join } from 'path';

export const registerModuleAliases = async (packageJsonPath: string) => {
  let rawdata = readFileSync(packageJsonPath).toString();
  let packageJson = JSON.parse(rawdata);
  if (packageJson['_moduleAliases']) {
    const toRegister = Object.entries(packageJson['_moduleAliases'] as { [key: string]: string }).reduce(
      (acc, [key, value]) => {
        return {
          ...acc,
          [key]: join(__dirname, value.replace('dist', 'tmp')),
        };
      },
      {},
    );
    addAliases(toRegister);
  }
};
