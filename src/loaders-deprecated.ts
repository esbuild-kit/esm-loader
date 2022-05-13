/**
 * Deprecated ESM loaders used in Node v12 & 14
 * https://nodejs.org/docs/latest-v12.x/api/esm.html#esm_hooks
 * https://nodejs.org/docs/latest-v14.x/api/esm.html#esm_hooks
 */
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
	transform,
	installSourceMapSupport,
} from '@esbuild-kit/core-utils';
import getTsconfig from 'get-tsconfig';
import {
	tsExtensionsPattern,
	isEsm,
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

	if (tsExtensionsPattern.test(url)) {
		const format = await getPackageType(url);
		return { format };
	}

	const defaultFormat = await defaultGetFormat(url, context, defaultGetFormat);

	/**
	 * .js files get set to CJS if package.json type is
	 * commonjs. In those cases, parse for ESM to verify.
	 */
	if (
		url.endsWith('.js')
		&& (
			defaultFormat.format === 'commonjs'
			|| defaultFormat.format === 'module'
		)
	) {
		const filePath = fileURLToPath(url);
		const source = await fs.promises.readFile(filePath, 'utf8');

		defaultFormat.format = (
			!(await isEsm(source))
				? 'commonjs'
				: 'module'
		);
	}

	return defaultFormat;
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

	return defaultTransformSource(source, context, defaultTransformSource);
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
