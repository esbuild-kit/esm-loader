import path from 'path';
import { installSourceMapSupport } from '@esbuild-kit/core-utils';
import {
	getTsconfig,
	parseTsconfig,
	createPathsMatcher,
} from 'get-tsconfig';
import { getPackageType } from './package-json';

export const applySourceMap = installSourceMapSupport();

const tsconfig = (
	process.env.ESBK_TSCONFIG_PATH
		? {
			path: process.env.ESBK_TSCONFIG_PATH,
			config: parseTsconfig(process.env.ESBK_TSCONFIG_PATH),
		}
		: getTsconfig()
);

export const tsconfigRaw = tsconfig?.config;
export const tsconfigPathsMatcher = tsconfig && createPathsMatcher(tsconfig);

export const fileProtocol = 'file://';

export const tsExtensionsPattern = /\.([cm]?ts|[tj]sx)$/;

const getFormatFromExtension = (fileUrl: string): ModuleFormat | undefined => {
	const extension = path.extname(fileUrl);

	if (extension === '.json') {
		return 'json';
	}

	if (extension === '.mjs' || extension === '.mts') {
		return 'module';
	}

	if (extension === '.cjs' || extension === '.cts') {
		return 'commonjs';
	}
};

export const getFormatFromFileUrl = (fileUrl: string) => {
	const format = getFormatFromExtension(fileUrl);

	if (format) {
		return format;
	}

	// ts, tsx, jsx
	if (tsExtensionsPattern.test(fileUrl)) {
		return getPackageType(fileUrl);
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
