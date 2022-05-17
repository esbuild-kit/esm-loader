import fs from 'node:fs';

console.log(
	'loaded esm-ext-mjs/index.mjs',
	Boolean(fs),
	Boolean(import('fs')),
	/:7:16/.test((new Error()).stack),
);

export default 1234;
