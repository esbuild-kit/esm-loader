/**
 * Deprecated ESM loaders used in Node v12 & 14
 * https://nodejs.org/docs/latest-v12.x/api/esm.html#esm_hooks
 * https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_hooks
 */
import {
	transform,
	transformDynamicImport,
	applySourceMap,
} from '@esbuild-kit/core-utils';
import {
	sourcemaps,
	tsconfigRaw,
	tsExtensionsPattern,
	getFormatFromExtension,
	compareNodeVersion,
	type ModuleFormat,
	type MaybePromise,
} from './utils';
import { getPackageType } from './package-json';

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
		const transformed = await transform(
			source.toString(),
			url,
			{
				tsconfigRaw,
			},
		);

		return {
			source: applySourceMap(transformed, url, sourcemaps),
		};
	}

	const result = await defaultTransformSource(source, context, defaultTransformSource);
	const dynamicImportTransformed = transformDynamicImport(result.source.toString());
	if (dynamicImportTransformed) {
		result.source = applySourceMap(
			dynamicImportTransformed,
			url,
			sourcemaps,
		);
	}

	return result;
};

const nodeSupportsDeprecatedLoaders = compareNodeVersion([16, 12, 0]) < 0;

export const getFormat = nodeSupportsDeprecatedLoaders ? _getFormat : undefined;
export const transformSource = nodeSupportsDeprecatedLoaders ? _transformSource : undefined;
