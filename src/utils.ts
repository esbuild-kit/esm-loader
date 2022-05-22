import path from 'path';
import { init, parse } from 'es-module-lexer';

export const tsExtensionsPattern = /\.([cm]?ts|[tj]sx)$/;

export const getFormatFromExtension = (filePath: string): ModuleFormat | undefined => {
	const extension = path.extname(filePath);

	if (extension === '.mjs' || extension === '.mts') {
		return 'module';
	}

	if (extension === '.cjs' || extension === '.cts') {
		return 'commonjs';
	}
};

export type ModuleFormat =
	| 'builtin'
	| 'dynamic'
	| 'commonjs'
	| 'json'
	| 'module'
	| 'wasm';

export type MaybePromise<T> = T | Promise<T>;

let isLexerReady = false;

// eslint-disable-next-line promise/catch-or-return
init.then(() => {
	isLexerReady = true;
});

/**
 * isESM - determined by whether the module
 * uses imports or exports
 */
const _isEsm = (source: string) => {
	const [imports, exports] = parse(source);

	return (
		imports.length > 0
		|| exports.length > 0
	);
};

export function isEsm(source: string) {
	if (!isLexerReady) {
		return init.then(() => _isEsm(source));
	}

	return _isEsm(source);
}
