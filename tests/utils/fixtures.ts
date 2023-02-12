export const importAndLog = (specifier: string) => `import("${specifier}").then(m => console.log(JSON.stringify(m)))`;
