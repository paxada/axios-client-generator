import { exec, ExecException } from 'child_process';
import { join } from 'path';

export const compiledProjectPath = join(__dirname, 'tmp');

export const compileTypescriptProject = (): Promise<{ error: ExecException; stdout: string; stderr: string }> => {
  console.log({ compiledProjectPath });
  return new Promise((resolve) =>
    exec(`tsc --outDir ${compiledProjectPath}`, (error: ExecException, stdout: string, stderr: string) =>
      resolve({ error, stdout, stderr }),
    ),
  );
};
