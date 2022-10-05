// import { fileURLToPath } from 'node:url';

async function test(description, testFunction) {
	try {
		const result = await testFunction();
		if (!result) { throw result; }
		console.log(`✔ ${description}`);
	} catch (error) {
		console.log(`✖ ${description}: ${error.toString().split('\n').shift()}`);
	}
}

console.log('loaded esm-ext-mjs/index.mjs');

test(
	'has CJS context',
	() => typeof require !== 'undefined' || typeof module !== 'undefined',
);

test(
	'name in error',
	() => {
		let nameInError;
		try {
			nameInError();
		} catch (error) {
			return error.message.includes('nameInError');
		}
	},
);

test(
	'sourcemaps',
	() => {
		const { stack } = new Error();
		console.log({
			stack,
			importMetaUrl: import.meta.url,
			importMetaAsUrl: new URL(import.meta.url),
			// path: fileURLToPath(import.meta.url),
			// pathMatch: stack.includes(fileURLToPath(import.meta.url) + ':35:'),
			pathname: (new URL(import.meta.url)).pathname,
			pathnameMatch: stack.includes((new URL(import.meta.url)).pathname),
		});
		const pathIndex = stack.indexOf((new URL(import.meta.url)).pathname + ':35:');
		const previousCharacter = stack[pathIndex - 1];
		return pathIndex > -1 && previousCharacter !== ':';
	},
);

test(
	'resolves optional node prefix',
	() => import('node:fs').then(Boolean),
);

test(
	'resolves required node prefix',
	() => import('node:test').then(Boolean),
);

test(
	'preserves names',
	() => (function functionName() {}).name === 'functionName',
);

export default 1234;
