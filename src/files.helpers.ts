import { ensureFileSync, readFileSync, writeFileSync } from 'fs-extra';
import * as glob from 'glob';
import { join, relative } from 'path';
import { compiledProjectPath } from './typescript_compiler';

export const replaceInFile = async (filePath: string, searchValue: string, replaceValue: string) => {
  const fileMatching = await filesMatching(filePath);
  if (!fileMatching[0]) return;
  const source = readFileSync(filePath).toString();
  if (source.includes(searchValue)) {
    const outputString = source.replace(new RegExp(searchValue, 'g'), replaceValue);
    ensureFileSync(filePath);
    writeFileSync(filePath, outputString);
  }
};

export const filesMatching = (globString: string) => {
  return new Promise<Array<string>>((res) => glob(globString, (err, files) => res(files)));
};

export const getExportedMembersFromFile = async (filePath: string) => {
  try {
    if (!filePath || (!filePath.endsWith('.js') && !filePath.endsWith('.ts'))) return false;
    const finalFilePathMatch = filePath.endsWith('.js')
      ? filePath
      : join(compiledProjectPath, "**", relative(join(process.cwd(), 'src'), filePath)).replace('.ts', '.js');
    const finalFilePath = (await filesMatching(finalFilePathMatch))[0]
    const requiredFile = global.require(finalFilePath);
    return requiredFile;
  } catch (error) {
    console.log(error);
    return false;
  }
};

export const insert = (textToInsert: string) => {
  return {
    atFirstLine: () => ({
      inFile: (filePath: string) => {
        const content = readFileSync(filePath);
        const splitted = content.toString().split('\n');
        writeFileSync(filePath, [textToInsert, ...splitted].join('\n'));
        return true;
      },
    }),
    aboveLineContaining: (anchor: string) => {
      return {
        inFile: async (filePath): Promise<boolean> => {
          const content = readFileSync(filePath);
          const splitted = content.toString().split('\n');
          const lineIndex = splitted.findIndex((line) => line.includes(anchor));
          if (lineIndex === -1) return false;
          writeFileSync(
            filePath,
            [...splitted.slice(0, lineIndex), textToInsert, ...splitted.slice(lineIndex)].join('\n'),
          );
          return true;
        },
      };
    },
  };
};
