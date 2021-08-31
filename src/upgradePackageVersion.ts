export const upgradePackageVersion = (currentVersion: string) => {
  const patchNumber = currentVersion.split('.').pop();
  const newPatchNumber = +patchNumber + 1;
  const splitVersion = currentVersion.split('.');
  return [...splitVersion.slice(0, splitVersion.length - 1), newPatchNumber.toString()].join('.');
};
