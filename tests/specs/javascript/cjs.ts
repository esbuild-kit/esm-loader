import { testSuite, expect } from 'manten';
import semver from 'semver';
import type { NodeApis } from '../../utils/node-with-loader';

const nodeSupportsNodePrefixRequire = '^14.18.0 || > 16.0.0';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('Load CJS', ({ describe }) => {
		describe('.cjs extension', ({ describe }) => {
			const output = 'loaded cjs-ext-cjs/index.cjs {"nodePrefix":true,"hasDynamicImport":true,"nameInError":true,"sourceMap":true}';

			describe('full path', ({ test }) => {
				const importPath = './lib/cjs-ext-cjs/index.cjs';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);

					if (semver.satisfies(node.version, nodeSupportsNodePrefixRequire)) {
						expect(nodeProcess.stdout).toBe(output);
					} else {
						expect(nodeProcess.stderr).toMatch('Cannot find module \'node:');
					}
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					if (semver.satisfies(node.version, nodeSupportsNodePrefixRequire)) {
						expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
					} else {
						expect(nodeProcess.stderr).toMatch('Cannot find module \'node:');
					}
				});

				test('TypeScript Import', async () => {
					const nodeProcess = await node.import(importPath, { typescript: true });
					if (semver.satisfies(node.version, nodeSupportsNodePrefixRequire)) {
						expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
					} else {
						expect(nodeProcess.stderr).toMatch('Cannot find module \'node:');
					}
				});
			});

			describe('extensionless - should not work', ({ test }) => {
				const importPath = './lib/cjs-ext-cjs/index';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stderr).toMatch('Cannot find module');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stderr).toMatch('Cannot find module');
				});
			});

			describe('directory', ({ test }) => {
				const importPath = './lib/cjs-ext-cjs';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stderr).toMatch('Error');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stderr).toMatch('Error');
				});
			});
		});

		/**
		 * This will not work via require() because the CommonJS loader
		 * will validate package.json#type to see if it's `commonjs`.
		 *
		 * Can be worked around by adding the require hook to overwrite:
		 * https://github.com/nodejs/node/blob/442e84a358d75152556b5d087e4dd6a51615330d/lib/internal/modules/cjs/loader.js#L1125
		 */
		describe('.js extension - should not work given package.json#type:module', ({ describe }) => {
			describe('full path', ({ test }) => {
				const importPath = './lib/cjs-ext-js/index.js';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);

					// Same error, different message
					expect(nodeProcess.stderr).toMatch('Error');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);

					// Same error, different message
					expect(nodeProcess.stderr).toMatch('Error');
				});
			});

			describe('extensionless', ({ test }) => {
				const importPath = './lib/cjs-ext-js/index';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);

					// Same error, different message
					expect(nodeProcess.stderr).toMatch('Error');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);

					// Same error, different message
					expect(nodeProcess.stderr).toMatch('Error');
				});
			});

			describe('directory', ({ test }) => {
				const importPath = './lib/cjs-ext-js';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);

					// Same error, different message
					expect(nodeProcess.stderr).toMatch('Error');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);

					// Same error, different message
					expect(nodeProcess.stderr).toMatch('Error');
				});
			});
		});
	});
});
