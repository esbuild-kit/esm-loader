/**
 * Deprecated ESM loaders used in Node v12 & 14
 * https://nodejs.org/docs/latest-v12.x/api/esm.html#esm_hooks
 * https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_hooks
 */
import { fileURLToPath } from 'url';
import {
	transform,
	transformDynamicImport,
	compareNodeVersion,
} from '@esbuild-kit/core-utils';
import type { TransformOptions } from 'esbuild';
import {
	applySourceMap,
	tsconfigRaw,
	tsExtensionsPattern,
	getFormatFromFileUrl,
	fileProtocol,
	type ModuleFormat,
	type MaybePromise,
} from './utils';

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

	try {
		return await defaultGetFormat(url, context, defaultGetFormat);
	} catch (error) {
		if (
			(error as any).code === 'ERR_UNKNOWN_FILE_EXTENSION'
			&& url.startsWith(fileProtocol)
		) {
			const format = await getFormatFromFileUrl(url);
			if (format) {
				return { format };
			}
		}

		throw error;
	}
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
	const filePath = url.startsWith('file://') ? fileURLToPath(url) : url;

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
			filePath,
			{
				tsconfigRaw: tsconfigRaw as TransformOptions['tsconfigRaw'],
			},
		);

		return {
			source: applySourceMap(transformed, url),
		};
	}

	const result = await defaultTransformSource(source, context, defaultTransformSource);

	if (context.format === 'module') {
		const dynamicImportTransformed = transformDynamicImport(filePath, result.source.toString());
		if (dynamicImportTransformed) {
			result.source = applySourceMap(
				dynamicImportTransformed,
				url,
			);
		}
	}

	return result;
};

const nodeSupportsDeprecatedLoaders = compareNodeVersion([16, 12, 0]) < 0;

export const getFormat = nodeSupportsDeprecatedLoaders ? _getFormat : undefined;
export const transformSource = nodeSupportsDeprecatedLoaders ? _transformSource : undefined;
