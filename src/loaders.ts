import {
	transform,
	installSourceMapSupport,
	transformDynamicImport,
} from '@esbuild-kit/core-utils';
import getTsconfig from 'get-tsconfig';
import { loadConfig, createMatchPath } from 'tsconfig-paths';
import {
	tsExtensionsPattern,
	getFormatFromExtension,
	type ModuleFormat,
	type MaybePromise,
} from './utils';
import { getPackageType } from './package-json';

const sourcemaps = installSourceMapSupport();

const tsconfig = getTsconfig();
const tsconfigRaw = tsconfig?.config;

type Resolved = {
	url: string;
	format: ModuleFormat;
};

type resolve = (
	specifier: string,
	context: {
		conditions: string[];
		parentURL: string | undefined;
	},
	defaultResolve: resolve,
) => MaybePromise<Resolved>;

const hasExtensionPattern = /\.\w+$/;

const extensions = ['.js', '.json', '.ts', '.tsx', '.jsx'] as const;
const possibleSuffixes = [
	...extensions,
	...extensions.map(extension => `/index${extension}` as const),
];

const tsconfigLoaded = loadConfig();

const matchPath = tsconfigLoaded.resultType === 'failed'
	? (v: string) => v
	: createMatchPath(
		tsconfigLoaded.absoluteBaseUrl,
		tsconfigLoaded.paths,
		tsconfigLoaded.mainFields,
		tsconfigLoaded.addMatchAll,
	);

// eslint-disable-next-line complexity, func-names
export const resolve: resolve = async function (
	specifier,
	context,
	defaultResolve,
) {
	// Added in v12.20.0
	// https://nodejs.org/api/esm.html#esm_node_imports
	if (specifier.startsWith('node:')) {
		specifier = specifier.slice(5);
	}

	// If directory, can be index.js, index.ts, etc.
	if (specifier.endsWith('/')) {
		return resolve(`${specifier}index`, context, defaultResolve);
	}

	// If file in tsconfig.paths
	const replaced = matchPath(specifier);
	if (replaced) {
		specifier = replaced;
	}

	/**
	 * Typescript gives .mts or .cts priority over actual .mjs or .cjs extensions
	 */
	if (
		/\.[cm]js$/.test(specifier)
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		&& tsExtensionsPattern.test(context.parentURL!)
	) {
		try {
			return await resolve(`${specifier.slice(0, -2)}ts`, context, defaultResolve);
		} catch (error) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((error as any).code !== 'ERR_MODULE_NOT_FOUND') {
				throw error;
			}
		}
	}

	let resolved: Resolved;
	try {
		resolved = await defaultResolve(specifier, context, defaultResolve);
	} catch (error) {
		if (error instanceof Error) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			if ((error as any).code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
				return resolve(`${specifier}/index`, context, defaultResolve);
			}

			if (
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(error as any).code === 'ERR_MODULE_NOT_FOUND'
				&& !hasExtensionPattern.test(specifier)
			) {
				for (const suffix of possibleSuffixes) {
					try {
						const trySpecifier = specifier + (
							specifier.endsWith('/') && suffix.startsWith('/')
								? suffix.slice(1)
								: suffix
						);

						return await resolve(trySpecifier, context, defaultResolve);
					} catch {}
				}
			}
		}

		throw error;
	}

	if (resolved.url.endsWith('.json')) {
		return {
			...resolved,
			format: 'json',
		};
	}

	let { format } = resolved;

	if (resolved.url.startsWith('file:')) {
		format = getFormatFromExtension(resolved.url) ?? format;

		if (!format) {
			format = await getPackageType(resolved.url);
		}
	}

	return {
		...resolved,
		format,
	};
};

type load = (
	url: string,
	context: {
		format: string;
		importAssertions: Record<string, string>;
	},
	defaultLoad: load,
) => MaybePromise<{
	format: string;
	source: string | ArrayBuffer | SharedArrayBuffer | Uint8Array;
}>;

// eslint-disable-next-line func-names
export const load: load = async function (
	url,
	context,
	defaultLoad,
) {
	if (process.send) {
		process.send({
			type: 'dependency',
			path: url,
		});
	}

	if (url.endsWith('.json')) {
		if (!context.importAssertions) {
			context.importAssertions = {};
		}
		context.importAssertions.type = 'json';
	}

	const loaded = await defaultLoad(url, context, defaultLoad);

	if (!loaded.source) {
		return loaded;
	}

	const code = loaded.source.toString();

	if (
		loaded.format === 'json'
		|| tsExtensionsPattern.test(url)
	) {
		const transformed = await transform(code, url, {
			format: 'esm',
			tsconfigRaw,
		});

		if (transformed.map) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			sourcemaps!.set(url, transformed.map);
		}

		return {
			format: 'module',
			source: transformed.code,
		};
	}

	const dynamicImportTransformed = transformDynamicImport({ code });
	if (dynamicImportTransformed) {
		loaded.source = dynamicImportTransformed.code;

		if (dynamicImportTransformed.map) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			sourcemaps!.set(url, dynamicImportTransformed.map);
		}
	}

	return loaded;
};
