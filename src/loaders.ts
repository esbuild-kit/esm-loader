import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';
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
	type ModuleFormat,
	type MaybePromise,
} from './utils.js';

type Resolved = {
	url: string;
	format: ModuleFormat | undefined;
};

type Context = {
	conditions: string[];
	parentURL: string | undefined;
};

type resolve = (
	specifier: string,
	context: Context,
	defaultResolve: resolve,
	recursiveCall?: boolean,
) => MaybePromise<Resolved>;

const extensions = ['.js', '.json', '.ts', '.tsx', '.jsx'] as const;

async function tryExtensions(
	specifier: string,
	context: Context,
	defaultResolve: resolve,
) {
	let error;
	for (const extension of extensions) {
		try {
			return await resolve(
				specifier + extension,
				context,
				defaultResolve,
				true,
			);
		} catch (_error: any) {
			if (error === undefined) {
				const { message } = _error;
				_error.message = _error.message.replace(`${extension}'`, "'");
				_error.stack = _error.stack.replace(message, _error.message);
				error = _error;
			}
		}
	}

	throw error;
}

async function tryDirectory(
	specifier: string,
	context: Context,
	defaultResolve: resolve,
) {
	const isExplicitDirectory = specifier.endsWith('/');
	const appendIndex = isExplicitDirectory ? 'index' : '/index';

	try {
		return await tryExtensions(specifier + appendIndex, context, defaultResolve);
	} catch (error: any) {
		if (!isExplicitDirectory) {
			try {
				return await tryExtensions(specifier, context, defaultResolve);
			} catch {}
		}

		const { message } = error;
		error.message = error.message.replace(`${appendIndex.replace('/', path.sep)}'`, "'");
		error.stack = error.stack.replace(message, error.message);
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
				const { code } = error as any;
				if (
					code !== 'ERR_MODULE_NOT_FOUND'
					&& code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED'
				) {
					throw error;
				}
			}
		}
	}

	let resolved: Resolved;
	try {
		resolved = await defaultResolve(specifier, context, defaultResolve);
	} catch (error) {
		if (
			error instanceof Error
			&& !recursiveCall
		) {
			const { code } = error as any;
			if (code === 'ERR_UNSUPPORTED_DIR_IMPORT') {
				try {
					return await tryDirectory(specifier, context, defaultResolve);
				} catch (error_) {
					if ((error_ as any).code !== 'ERR_PACKAGE_IMPORT_NOT_DEFINED') {
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

let messagePort: MessagePort | undefined;
export function globalPreload({ port }: {port: MessagePort}) {
	messagePort = port;
	return `\
	  	port.onmessage = (evt) => {
			const command = evt.data?.command;
			if (command === 'BYPASS_PROCESS_SEND') {
				process.send(...evt.data.args)
			}
	  	};
	`;
}

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
	} else if (messagePort) {
		messagePort.postMessage({
			command: 'BYPASS_PROCESS_SEND',
			args: [{
				type: 'dependency',
				path: url,
			}],
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

	const filePath = url.startsWith('file://') ? fileURLToPath(url) : url;
	const code = loaded.source.toString();

	if (
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
			source: applySourceMap(transformed, url),
		};
	}

	if (loaded.format === 'module') {
		const dynamicImportTransformed = transformDynamicImport(filePath, code);
		if (dynamicImportTransformed) {
			loaded.source = applySourceMap(
				dynamicImportTransformed,
				url,
			);
		}
	}

	return loaded;
};
