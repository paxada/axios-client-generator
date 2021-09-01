import { readFileSync } from 'fs-extra';
import { join } from 'path';

export const getModuleAlisases = (
  path: string,
  target: string,
  isForBuild: boolean = false,
): Record<string, string> => {
  const rawData = readFileSync(join(path, 'package.json')).toString();
  const packageJson = JSON.parse(rawData);
  if (packageJson['_moduleAliases']) {
    return Object.entries(packageJson['_moduleAliases'] as { [key: string]: string }).reduce<{
      [aliasKey: string]: string;
    }>((acc, [key, value]) => {
      return {
        ...acc,
        [key]: join(target, value.replace('dist', isForBuild ? 'tmp' : 'src')),
      };
    }, {});
  }
  return {};
};
