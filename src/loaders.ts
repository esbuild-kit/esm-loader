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

const sourcemaps = installSourceMapSupport();

const tsconfig = getTsconfig();
const tsconfigRaw = tsconfig?.config;

type resolve = (
	specifier: string,
	context: {
		conditions: string[];
		parentURL: string | undefined;
	},
	defaultResolve: resolve,
) => MaybePromise<{
	url: string;
	format: ModuleFormat;
}>;

const hasExtensionPattern = /\.\w+$/;

const extensions = ['.js', '.json', '.ts', '.tsx', '.jsx'] as const;
const possibleSuffixes = [
	...extensions,
	...extensions.map(extension => `/index${extension}` as const),
];

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

	/**
	 * Typescript gives .mts or .cts priority over actual .mjs or .cjs extensions
	 */
	if (
		/\.[cm]js$/.test(specifier)
		&& tsExtensionsPattern.test(context.parentURL!)
	) {
		try {
			return await resolve(`${specifier.slice(0, -2)}ts`, context, defaultResolve);
		} catch (error) {
			if ((error as any).code !== 'ERR_MODULE_NOT_FOUND') {
				throw error;
			}
		}
	}

	if (tsExtensionsPattern.test(specifier)) {
		return {
			...(await defaultResolve(specifier, context, defaultResolve)),
			format: 'module',
		};
	}

	if (specifier.endsWith('.json')) {
		return {
			...(await defaultResolve(specifier, context, defaultResolve)),
			format: 'json',
		};
	}

	try {
		const resolved = await defaultResolve(specifier, context, defaultResolve);

		/**
		 * The format depends on package.json type. If it's commonjs,
		 * the file doesn't get read for it to be deferred to CJS loading.
		 *
		 * Set it to module so the file gets read, and the loader can
		 * revert it back to commonjs if it's actually commonjs.
		 */
		if (
			specifier.endsWith('.js')
			&& resolved.format === 'commonjs'
		) {
			resolved.format = 'module';
		}

		return resolved;
	} catch (error) {
		if (error instanceof Error) {
			if ((error as any).code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
				return resolve(`${specifier}/index`, context, defaultResolve);
			}

			if (
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

						return {
							...(await defaultResolve(trySpecifier, context, defaultResolve)),
							format: suffix === '.json' ? 'json' : 'module',
						};
					} catch {}
				}
			}
		}

		throw error;
	}
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

	if (
		!loaded.source

		// node_modules don't need to be transformed
		|| url.includes('/node_modules/')
	) {
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
			sourcemaps!.set(url, transformed.map);
		}

		return {
			format: 'module',
			source: transformed.code,
		};
	}

	if (!(await isEsm(code))) {
		loaded.format = 'commonjs';
	}

	return loaded;
};
