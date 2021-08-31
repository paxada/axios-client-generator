import { relative } from 'path';

export const createExportsString = (exportsData: Array<{ basePath: string; targetPath: string }>): string => {
  return exportsData
    .map((data) => {
      const path = relative(data.basePath, data.targetPath).replace('.ts', '');
      return `export * from "${path}";`;
    })
    .join('\n');
};
