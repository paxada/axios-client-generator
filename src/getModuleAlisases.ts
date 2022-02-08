import { readFileSync } from 'fs-extra';
import {join, relative} from 'path';
import {filesMatching} from "./files.helpers";

export const getModuleAlisases = async (
  path: string,
  target: string,
  isForBuild: boolean = false,
): Promise<Record<string, string>> => {
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
  const tsConfigJsonRawData = readFileSync(join(path,'tsconfig.json')).toString();
  const tsConfigJson = JSON.parse(tsConfigJsonRawData);
  if (tsConfigJson['compilerOptions'] && tsConfigJson.compilerOptions["paths"]) {
    return Object.entries(tsConfigJson.compilerOptions["paths"] as { [key: string]: string }).reduce<Promise<{
      [aliasKey: string]: string;
    }>>(async (acc, [key, [value]]) => {
      const folderPathMatch = join(target, (isForBuild ? 'tmp' : 'src'), "**", value.replace("/*", ""));
      const folderPath = (await filesMatching(folderPathMatch))[0]
      return {
        ...(await acc),
        [key.replace("/*", "")]: folderPath,
      };
    }, Promise.resolve({}))
  }
  return {};
};
