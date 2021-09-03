import { readFileSync } from 'fs-extra';
import { join } from 'path';

export const getPackageJsonData = (
  path: string,
): {
  name: string;
  version?: string;
  author: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} => {
  try {
    let rawData = readFileSync(join(path, 'package.json')).toString();
    let packageJson = JSON.parse(rawData);
    const version = packageJson['version'];
    const name = packageJson['name'];
    const author = packageJson['author'];
    const dependencies = packageJson['dependencies'];
    const devDependencies = packageJson['devDependencies'];
    return {
      version: version !== undefined && typeof version === 'string' ? version : undefined,
      name: name !== undefined && typeof name === 'string' ? name : 'unknown',
      author: author !== undefined && typeof author === 'string' ? name : 'unknown',
      dependencies:
        dependencies !== undefined &&
        typeof dependencies === 'object' &&
        Object.values(dependencies).every((d) => typeof d === 'string')
          ? dependencies
          : {},
      devDependencies:
        devDependencies !== undefined &&
        typeof devDependencies === 'object' &&
        Object.values(devDependencies).every((d) => typeof d === 'string')
          ? devDependencies
          : {},
    };
  } catch (e) {
    console.log(`No package.json found at path: ${path}`);
  }
  return { name: 'unknown', author: 'unknown', dependencies: {}, devDependencies: {} };
};
