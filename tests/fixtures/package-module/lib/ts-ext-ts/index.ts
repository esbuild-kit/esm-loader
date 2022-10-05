async function test(description, testFunction) {
	try {
		const result = await testFunction();
		if (!result) { throw result; }
		console.log(`✔ ${description}`);
	} catch (error) {
		console.log(`✖ ${description}: ${error.toString().split('\n').shift()}`);
	}
}

console.log('loaded ts-ext-ts/index.ts');

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
		console.log({
			stack,
		});
		let { pathname } = new URL(import.meta.url);
		if (process.platform === 'win32') {
			pathname = pathname.slice(1);
		}
		let pathIndex = stack.indexOf(pathname + ':33:');
		if (pathIndex === -1) {
			pathIndex = stack.indexOf(pathname.toLowerCase() + ':33:');
		}
		const previousCharacter = stack[pathIndex - 1];
		return pathIndex > -1 && previousCharacter !== ':';
	},
);

test(
	'has dynamic import',
	() => import('fs').then(Boolean),
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

function valueNumber(value: number) {
	return value;
}

export default valueNumber(1234);
