import type { PackageJson, TsConfigJson } from 'type-fest';

export const packageJson = (
	packageJsonObject: PackageJson,
) => JSON.stringify(packageJsonObject);

export const tsconfigJson = (
	tsconfigJsonObject: TsConfigJson,
) => JSON.stringify(tsconfigJsonObject);

export const importAndLog = (
	specifier: string,
) => `import("${specifier}").then(m => console.log(JSON.stringify(m)))`;
