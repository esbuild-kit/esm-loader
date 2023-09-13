const { fileURLToPath } = require('node:url');

async function test(description: string, testFunction: () => any | Promise<any>) {
	try {
		const result = await testFunction();
		if (!result) { throw result; }
		console.log(`✔ ${description}`);
	} catch (error) {
		console.log(`✖ ${description}: ${error.toString().split('\n').shift()}`);
	}
}

console.log('loaded ts-ext-cts/index.cts');

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
		const stack = (new Error()).stack!;
		const errorPosition = ':35:';
		const isWindows = process.platform === 'win32';
		let pathname = fileURLToPath(import.meta.url);
		if (isWindows) {
			// Remove drive letter
			pathname = pathname.slice(2);
		}

		let pathIndex = stack.indexOf(`${pathname}${errorPosition}`);
		if (
			pathIndex === -1
			&& isWindows
		) {
			// Convert backslash to slash
			pathname = pathname.replace(/\\/g, '/');
			pathIndex = stack.indexOf(`${pathname}${errorPosition}`);
		}

		return pathIndex > -1;
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
