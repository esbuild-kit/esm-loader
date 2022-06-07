import path from 'path';

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
