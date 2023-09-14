import path from 'path';
import type { ModuleFormat } from 'module';
import { installSourceMapSupport } from '@esbuild-kit/core-utils';
import {
	getTsconfig,
	parseTsconfig,
	createPathsMatcher,
	createFilesMatcher,
} from 'get-tsconfig';
import { getPackageType } from './package-json.js';

export const applySourceMap = installSourceMapSupport();

function getProjectsMap(tsconfigPath?: string, projectsMap?: Map<string, {
	tsconfig: ReturnType<typeof getTsconfig>;
	tsconfigPathsMatcher: ReturnType<typeof createPathsMatcher>;
	fileMatcher: ReturnType<typeof createFilesMatcher>;
}>) {
	if (!projectsMap) {
		projectsMap = new Map();
	}

	const tsconfig = (
		tsconfigPath
			? {
				path: path.resolve(tsconfigPath),
				config: parseTsconfig(tsconfigPath),
			}
			: getTsconfig()
	);

	if (!tsconfig) {
		return projectsMap;
	}

	if (projectsMap.has(tsconfig.path)) {
		return projectsMap;
	}

	projectsMap.set(tsconfig.path, {
		tsconfig,
		tsconfigPathsMatcher: tsconfig && createPathsMatcher(tsconfig),
		fileMatcher: tsconfig && createFilesMatcher(tsconfig),
	});

	tsconfig?.config?.references?.forEach((reference) => {
		const referencedTsconfigPath = reference.path.endsWith('.json') ? reference.path : path.join(reference.path, 'tsconfig.json');
		projectsMap = getProjectsMap(referencedTsconfigPath, projectsMap);
	});

	return projectsMap;
}

export const projectsMap = getProjectsMap(process.env.ESBK_TSCONFIG_PATH);

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

export type MaybePromise<T> = T | Promise<T>;

export type NodeError = Error & {
	code: string;
};
