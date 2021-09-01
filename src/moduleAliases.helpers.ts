import { addAliases } from 'module-alias';
import { getModuleAlisases } from './getModuleAlisases';

export const registerModuleAliases = async (projectPath: string) => {
  const toRegister = getModuleAlisases(projectPath, __dirname, true);
  addAliases(toRegister);
};
