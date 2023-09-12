import type { MessagePort } from 'node:worker_threads';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
import type {
	ResolveFnOutput, ResolveHookContext, LoadHook, GlobalPreloadHook, InitializeHook,
} from 'module';
import {
	transform,
	transformDynamicImport,
	resolveTsPath,
	compareNodeVersion,
} from '@esbuild-kit/core-utils';
import type { TransformOptions } from 'esbuild';
import {
	applySourceMap,
	tsconfigPathsMatcher,
	fileMatcher,
	tsExtensionsPattern,
	getFormatFromFileUrl,
	fileProtocol,
	type MaybePromise,
	type NodeError,
} from './utils.js';

type NextResolve = (
	specifier: string,
	context?: ResolveHookContext,
) => MaybePromise<ResolveFnOutput>;

type resolve = (
	specifier: string,
	context: ResolveHookContext,
	nextResolve: NextResolve,
	recursiveCall?: boolean,
) => MaybePromise<ResolveFnOutput>;

/**
 * Technically globalPreload is deprecated so it should be in loaders-deprecated
 * but it shares a closure with the new load hook
 */
let mainThreadPort: MessagePort | undefined;
export const globalPreload: GlobalPreloadHook = ({ port }) => {
	mainThreadPort = port;
	return `
	const require = getBuiltin('module').createRequire("${import.meta.url}");
	require('@esbuild-kit/core-utils').installSourceMapSupport(port);
	port.unref(); // Allows process to exit without waiting for port to close
	`;
};

/**
 * From Node.js v20.6.0, `globalPreload` is deprecarated in favor of `initialize`
 * However, it requires the loader to be loaded via `--import` that registers
 * the loader instead of directly loading the loader via `--loader`
 *
 * https://nodejs.org/api/esm.html#initialize
 */
export const initialize: InitializeHook = () => {
	console.log('initialize');
};

const extensions = ['.js', '.json', '.ts', '.tsx', '.jsx'] as const;

async function tryExtensions(
	specifier: string,
	context: ResolveHookContext,
	defaultResolve: NextResolve,
) {
	let throwError: Error | undefined;
	for (const extension of extensions) {
		try {
			return await resolve(
				specifier + extension,
				context,
				defaultResolve,
				true,
			);
		} catch (_error) {
			if (
				throwError === undefined
				&& _error instanceof Error
			) {
				const { message } = _error;
				_error.message = _error.message.replace(`${extension}'`, "'");
				_error.stack = _error.stack!.replace(message, _error.message);
				throwError = _error;
			}
		}
	}

	throw throwError;
}

async function tryDirectory(
	specifier: string,
	context: ResolveHookContext,
	defaultResolve: NextResolve,
) {
	const isExplicitDirectory = specifier.endsWith('/');
	const appendIndex = isExplicitDirectory ? 'index' : '/index';

	try {
		return await tryExtensions(specifier + appendIndex, context, defaultResolve);
	} catch (_error) {
		if (!isExplicitDirectory) {
			try {
				return await tryExtensions(specifier, context, defaultResolve);
			} catch {}
		}

		const error = _error as Error;
		const { message } = error;
		error.message = error.message.replace(`${appendIndex.replace('/', path.sep)}'`, "'");
		error.stack = error.stack!.replace(message, error.message);
		throw error;
	}
}

const isPathPattern = /^\.{0,2}\//;

const supportsNodePrefix = (
	compareNodeVersion([14, 13, 1]) >= 0
	|| compareNodeVersion([12, 20, 0]) >= 0
);

export const resolve: resolve = async function (
	specifier,
	context,
	defaultResolve,
	recursiveCall,
) {
	// Added in v12.20.0
	// https://nodejs.org/api/esm.html#esm_node_imports
	if (!supportsNodePrefix && specifier.startsWith('node:')) {
		specifier = specifier.slice(5);
	}

	// If directory, can be index.js, index.ts, etc.
	if (specifier.endsWith('/')) {
		return await tryDirectory(specifier, context, defaultResolve);
	}

	const isPath = (
		specifier.startsWith(fileProtocol)
		|| isPathPattern.test(specifier)
	);

	if (
		tsconfigPathsMatcher
		&& !isPath // bare specifier
		&& !context.parentURL?.includes('/node_modules/')
	) {
		const possiblePaths = tsconfigPathsMatcher(specifier);
		for (const possiblePath of possiblePaths) {
			try {
				return await resolve(
					pathToFileURL(possiblePath).toString(),
					context,
					defaultResolve,
				);
			} catch {}
		}
	}

	/**
	 * Typescript gives .ts, .cts, or .mts priority over actual .js, .cjs, or .mjs extensions
	 */
	if (tsExtensionsPattern.test(context.parentURL!)) {
		const tsPath = resolveTsPath(specifier);

		if (tsPath) {
			try {
				return await resolve(tsPath, context, defaultResolve, true);
			} catch (error) {
				const { code } = error as NodeError;
				if (
					code !== 'ERR_MODULE_NOT_FOUND'
					&& code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED'
				) {
					throw error;
				}
			}
		}
	}

	let resolved: ResolveFnOutput;
	try {
		resolved = await defaultResolve(specifier, context);
	} catch (error) {
		if (
			error instanceof Error
			&& !recursiveCall
		) {
			const { code } = error as NodeError;
			if (code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
				try {
					return await tryDirectory(specifier, context, defaultResolve);
				} catch (error_) {
					if ((error_ as NodeError).code !== 'ERR_PACKAGE_IMPORT_NOT_DEFINED') {
						throw error_;
					}
				}
			}

			if (code === 'ERR_MODULE_NOT_FOUND') {
				try {
					return await tryExtensions(specifier, context, defaultResolve);
				} catch {}
			}
		}

		throw error;
	}

	if (
		!resolved.format
		&& resolved.url.startsWith(fileProtocol)
	) {
		resolved.format = await getFormatFromFileUrl(resolved.url);
	}

	return resolved;
};

export const load: LoadHook = async function (
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

	const loaded = await defaultLoad(url, context);

	if (!loaded.source) {
		return loaded;
	}

	const filePath = url.startsWith('file://') ? fileURLToPath(url) : url;
	const code = loaded.source.toString();

	if (
		// Support named imports in JSON modules
		loaded.format === 'json'
		|| tsExtensionsPattern.test(url)
	) {
		const transformed = await transform(
			code,
			filePath,
			{
				tsconfigRaw: fileMatcher?.(filePath) as TransformOptions['tsconfigRaw'],
			},
		);

		return {
			format: 'module',
			source: applySourceMap(transformed, url, mainThreadPort),
		};
	}

	if (loaded.format === 'module') {
		const dynamicImportTransformed = transformDynamicImport(filePath, code);
		if (dynamicImportTransformed) {
			loaded.source = applySourceMap(
				dynamicImportTransformed,
				url,
				mainThreadPort,
			);
		}
	}

	return loaded;
};
