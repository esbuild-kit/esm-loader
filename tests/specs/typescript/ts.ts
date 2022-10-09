import { testSuite, expect } from 'manten';
import semver from 'semver';
import type { NodeApis } from '../../utils/node-with-loader';
import nodeSupports from '../../utils/node-supports';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.ts extension', ({ describe }) => {
		function assertResults(stdout: string, filename = 'ts-ext-ts/index.ts') {
			expect(stdout).toMatch(`loaded ${filename}\n`);
			expect(stdout).toMatch('✖ has CJS context');
			expect(stdout).toMatch('✔ name in error');
			expect(stdout).toMatch('✔ sourcemaps');
			expect(stdout).toMatch('✔ has dynamic import');
			expect(stdout).toMatch('✔ resolves optional node prefix');
			expect(stdout).toMatch('✔ preserves names');
			expect(stdout).toMatch(
				semver.satisfies(node.version, nodeSupports.testRunner)
					? '✔ resolves required node prefix'
					: '✖ resolves required node prefix: Error [ERR_UNKNOWN_BUILTIN_MODULE]',
			);
		}

		describe('full path', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.ts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout);
			});

			if (semver.satisfies(node.version, nodeSupports.nodePrefixRequire)) {
				test('Disables native source map if Error.prepareStackTrace is customized', async () => {
					const nodeProcess = await node.load(importPath, {
						nodeOptions: ['-r', 'source-map-support/register'],
					});
					assertResults(nodeProcess.stdout);
				});
			}

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertResults(nodeProcess.stdout);
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});

		describe('full path via .js', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.js';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout, 'ts-ext-ts/index.ts');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath, { typescript: true });
				assertResults(nodeProcess.stdout);
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});

		describe('extensionless', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertResults(nodeProcess.stdout);
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});

		describe('extensionless with subextension', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.tsx';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout, 'ts-ext-ts/index.tsx.ts');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertResults(nodeProcess.stdout, 'ts-ext-ts/index.tsx.ts');
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});

		describe('directory', ({ test }) => {
			const importPath = './lib/ts-ext-ts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertResults(nodeProcess.stdout);
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});
	});
});
