import { camelCase, pascalCase } from 'change-case';
import { ensureFileSync, readFileSync, writeFileSync } from 'fs-extra';
import * as handlebars from 'handlebars';

handlebars.registerHelper('pascalCase', function (options) {
  return pascalCase(options.fn(this));
});

handlebars.registerHelper('camelCase', function (options) {
  return camelCase(options.fn(this));
});

handlebars.registerHelper('upperCase', function (options) {
  return options.fn(this).toUpperCase();
});

handlebars.registerHelper('ifOr', function (...args) {
  const options = args.pop();
  if (args.some((arg) => !!arg)) {
    return options.fn(this);
  }
  return options.inverse(this);
});

handlebars.registerHelper('ifNot', function (...args) {
  const options = args.pop();
  if (args.every((arg) => !arg)) {
    return options.fn(this);
  }
  return options.inverse(this);
});

export const formatHBS = (hbs: string, data: any): string => {
  const template = handlebars.compile(hbs);
  return template(data);
};

export const createFileFromHBS = ({ filePath, templatePath, data }) => {
  const source = readFileSync(templatePath);
  const outputString = formatHBS(source.toString(), data);
  ensureFileSync(filePath);
  writeFileSync(filePath, outputString);
};
