import { pathExistsSync } from 'fs-extra';

export const checkExistingPaths = (
  paths: Array<string>,
): { hasFailed: false } | { hasFailed: true; message: string } => {
  return paths.reduce<{ hasFailed: false } | { hasFailed: true; message: string }>(
    (res, path) => {
      if (pathExistsSync(path)) return res;
      const message = 'Wrong extra export path: ' + path;
      if (res.hasFailed) {
        return { hasFailed: true, message: res.message + '\n' + message };
      }
      return { hasFailed: true, message };
    },
    { hasFailed: false },
  );
};
