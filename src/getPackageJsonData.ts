import { readFileSync } from 'fs-extra';
import { join } from 'path';

export const getPackageJsonData = (path: string): { name: string; version: string } => {
  try {
    let rawData = readFileSync(join(path, 'package.json')).toString();
    let tsConfigJson = JSON.parse(rawData);
    const version = tsConfigJson['version'];
    const name = tsConfigJson['name'];
    return {
      version: version !== undefined && typeof version === 'string' ? version : '1.0.0',
      name: name !== undefined && typeof name === 'string' ? name : 'unknown',
    };
  } catch (e) {
    console.log(`No package.json found at path: ${path}`);
  }
  return { version: '1.0.0', name: 'unknown' };
};
