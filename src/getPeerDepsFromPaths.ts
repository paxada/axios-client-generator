import { readFileSync } from 'fs-extra';
import { join } from 'path';
import { getPackageJsonData } from './getPackageJsonData';
import { getModuleAlisases } from './getModuleAlisases';

const replaceAliases = (moduleAliases: Record<string, string>, path: string): string =>
  Object.entries(moduleAliases).reduce<string>((res, [aliasKey, aliasPath]) => res.replace(aliasKey, aliasPath), path);

const getFolderPath = (path: string): string => path.replace(/(.*)\/.*\.ts/, '$1');

const getDepsFromPath = (path: string, moduleAliases: Record<string, string>): Array<string> => {
  const content = readFileSync(path).toString();
  const matches = content.match(/import.*from '(.*)';/g);
  const imports = (matches || []).map((match) => match.match(/import.*from '(.*)';/)[1]);

  const { npmDeps, projectDeps } = imports.reduce<{ npmDeps: Array<string>; projectDeps: Array<string> }>(
    (res, dep) => {
      console.log({ res });
      if (dep.startsWith('@/')) {
        const depPath = replaceAliases(moduleAliases, dep + '.ts');
        return { ...res, projectDeps: [...res.projectDeps, depPath] };
      }

      if (dep.startsWith('@')) return { ...res, npmDeps: [...res.npmDeps, dep] };

      if (dep.includes('/')) {
        const depPath = join(getFolderPath(path), dep + '.ts');
        return { ...res, projectDeps: [...res.projectDeps, depPath] };
      }

      return { ...res, npmDeps: [...res.npmDeps, dep] };
    },
    { npmDeps: [], projectDeps: [] },
  );

  const deeperNpmDeps = projectDeps.map((dep) => getDepsFromPath(dep, moduleAliases)).flat();

  return [...npmDeps, ...deeperNpmDeps];
};

export const getPeerDepsFromPaths = (basePath: string, paths: Array<string>) => {
  const moduleAliases = getModuleAlisases(basePath, basePath);
  const deps = paths.map((path) => getDepsFromPath(path, moduleAliases)).flat();
  const uniqueDeps = [...new Set(deps)];

  const { dependencies, devDependencies } = getPackageJsonData(basePath);

  const versionedDependencies = uniqueDeps.reduce<Array<string>>((res, depName) => {
    if (depName in dependencies) return [...res, `"${depName}": "${dependencies[depName]}"`];
    if (depName in devDependencies) return [...res, `"${depName}": "${devDependencies[depName]}"`];
    return res;
  }, []);

  return `"peerDependencies": {\n${versionedDependencies.join(',\n')}\n }`;
};
