import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { execaNode } from 'execa';
import getNode from 'get-node';

type Options = {
	args: string[];
	nodePath: string;
	cwd?: string;
	env?: NodeJS.ProcessEnv;
	nodeOptions?: string[];
};

const __dirname = fileURLToPath(import.meta.url);

export const nodeWithLoader = (
	options: Options,
) => execaNode(
	options.args[0],
	options.args.slice(1),
	{
		env: {
			ESBK_DISABLE_CACHE: '1',
			...options.env,
		},
		nodeOptions: [
			...(options.nodeOptions ?? []),

			'--loader',
			pathToFileURL(
				path.resolve(__dirname, '../../../dist/index.js'),
			).toString(),
		],
		nodePath: options.nodePath,
		cwd: options.cwd,
		reject: false,
	},
);

export async function createNode(
	nodeVersion: string,
	fixturePath: string,
) {
	const node = await getNode(nodeVersion);

	return {
		version: node.version,
		load(
			filePath: string,
			options?: {
				cwd?: string;
				env?: typeof process.env;
				nodeOptions?: string[];
			},
		) {
			return nodeWithLoader(
				{
					args: [filePath],
					nodePath: node.path,
					cwd: path.resolve(fixturePath, options?.cwd ?? ''),
					env: options?.env,
					nodeOptions: options?.nodeOptions,
				},
			);
		},
		import(
			filePath: string,
			options?: {
				typescript?: boolean;
			},
		) {
			return nodeWithLoader({
				args: [
					`./import-file${options?.typescript ? '.ts' : '.js'}`,
					filePath,
				],
				nodePath: node.path,
				cwd: fixturePath,
			});
		},
	};
}

export type NodeApis = Awaited<ReturnType<typeof createNode>>;
