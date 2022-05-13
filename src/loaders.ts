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
	 * Typescript 4.6.0 behavior seems to be that if `.mjs` is specified,
	 * it converts it to mts without testing if it exists, and without
	 * consideration for whether a file with .mjs exists
	 */
	if (
		/\.[cm]js$/.test(specifier)
		&& tsExtensionsPattern.test(context.parentURL!)
	) {
		specifier = `${specifier.slice(0, -2)}ts`;
	}

	if (tsExtensionsPattern.test(specifier)) {
		const resolved = await defaultResolve(specifier, context, defaultResolve);
		const format = await getPackageType(resolved.url);

		return {
			...resolved,
			format,
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
		 * When returning 'commonjs' in resolve(), the load() function
		 * won't even read the file contents, and leave it to the CJS
		 * loader to do that.
		 *
		 * Since we need to check if the file is actually CJS, we need to
		 * make it think its a "module", read the file, and confirm
		 * that it's a cjs file in loader().
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
		// When returning as commonjs, the "source" output is ignored
		loaded.format = 'commonjs';
	}

	return loaded;
};
