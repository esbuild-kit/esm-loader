/**
 * Deprecated ESM loaders used in Node v12 & 14
 * https://nodejs.org/docs/latest-v12.x/api/esm.html#esm_hooks
 * https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_hooks
 */
import {
	transform,
	installSourceMapSupport,
	transformDynamicImport,
} from '@esbuild-kit/core-utils';
import getTsconfig from 'get-tsconfig';
import {
	tsExtensionsPattern,
	getFormatFromExtension,
	type ModuleFormat,
	type MaybePromise,
} from './utils';
import { getPackageType } from './package-json';

const tsconfig = getTsconfig();
const tsconfigRaw = tsconfig?.config;

const sourcemaps = installSourceMapSupport();

type getFormat = (
	url: string,
	context: Record<string, unknown>,
	defaultGetFormat: getFormat,
) => MaybePromise<{ format: ModuleFormat }>;

const _getFormat: getFormat = async function (
	url,
	context,
	defaultGetFormat,
) {
	if (url.endsWith('.json')) {
		return { format: 'module' };
	}

	if (url.startsWith('file:')) {
		const format = getFormatFromExtension(url) ?? await getPackageType(url);
		return { format };
	}

	return await defaultGetFormat(url, context, defaultGetFormat);
};

type Source = string | SharedArrayBuffer | Uint8Array;

type transformSource = (
	source: Source,
	context: {
		url: string;
		format: ModuleFormat;
	},
	defaultTransformSource: transformSource,
) => MaybePromise<{ source: Source }>

const _transformSource: transformSource = async function (
	source,
	context,
	defaultTransformSource,
) {
	const { url } = context;

	if (process.send) {
		process.send({
			type: 'dependency',
			path: url,
		});
	}

	if (
		url.endsWith('.json')
		|| tsExtensionsPattern.test(url)
	) {
		const transformed = await transform(source.toString(), url, {
			format: 'esm',
			tsconfigRaw,
		});

		if (transformed.map) {
			sourcemaps!.set(url, transformed.map);
		}

		return {
			source: transformed.code,
		};
	}

	const result = await defaultTransformSource(source, context, defaultTransformSource);
	const dynamicImportTransformed = transformDynamicImport({ code: result.source.toString() });
	if (dynamicImportTransformed) {
		result.source = dynamicImportTransformed.code;

		if (dynamicImportTransformed.map) {
			sourcemaps!.set(url, dynamicImportTransformed.map);
		}
	}

	return result;
};

const loadersDeprecatedVersion = [16, 12, 0];
const nodeVersion = process.version.slice(1).split('.').map(Number);

const nodeSupportsDeprecatedLoaders = (
	nodeVersion[0] - loadersDeprecatedVersion[0]
	|| nodeVersion[1] - loadersDeprecatedVersion[1]
	|| nodeVersion[2] - loadersDeprecatedVersion[2]
) < 0;

export const getFormat = nodeSupportsDeprecatedLoaders ? _getFormat : undefined;
export const transformSource = nodeSupportsDeprecatedLoaders ? _transformSource : undefined;
