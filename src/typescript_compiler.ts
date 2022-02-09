import { exec, ExecException } from 'child_process';
import { join } from 'path';

export const compiledProjectPath = join(__dirname, 'tmp');

export const compileTypescriptProject = (
  tsConfigPath: string = 'tsconfig.json',
): Promise<{ error: ExecException; stdout: string; stderr: string }> => {
  return new Promise((resolve) =>
    exec(
      `rm -rf ${compiledProjectPath} && tsc --project ${tsConfigPath} --outDir ${compiledProjectPath}`,
      (error: ExecException, stdout: string, stderr: string) => resolve({ error, stdout, stderr }),
    ),
  );
};
