import { readFileSync, writeFileSync } from 'fs-extra';
import { join, relative } from 'path';

export const addAliasesInTsConfig = (params: { projectFolderPath: string; srcPath: string }) => {
  const { projectFolderPath, srcPath } = params;
  let rawData = readFileSync(join(process.cwd(), 'tsconfig.json')).toString();
  let tsConfigJson = JSON.parse(rawData);
  const paths = tsConfigJson['compilerOptions']?.['paths'];
  if (paths && Object.keys(paths).length > 0) {
    const clientPaths = Object.entries(paths).reduce<Record<string, Array<string>>>((res, [key, value]) => {
      if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === 'string')) {
        const newPathValues = value.map((v) => relative(srcPath, join(process.cwd(), 'src', v)));
        return { ...res, [key]: newPathValues };
      }
      return res;
    }, {});

    let clientRawData = readFileSync(join(projectFolderPath, 'tsconfig.json')).toString();
    let clientTsConfigJson = JSON.parse(clientRawData);
    if ('compilerOptions' in clientTsConfigJson && typeof clientTsConfigJson.compilerOptions === 'object') {
      clientTsConfigJson.compilerOptions.paths = clientPaths;
      writeFileSync(join(projectFolderPath, 'tsconfig.json'), clientTsConfigJson);
    }
  }
};
