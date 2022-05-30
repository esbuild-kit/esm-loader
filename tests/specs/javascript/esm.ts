import { testSuite, expect } from 'manten';
import type { NodeApis } from '../../utils/node-with-loader';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('Load ESM', ({ describe }) => {
		describe('.mjs extension', ({ describe }) => {
			const output = 'loaded esm-ext-mjs/index.mjs {"nodePrefix":true,"hasDynamicImport":true,"nameInError":true,"sourceMap":true}';

			describe('full path', ({ test }) => {
				const importPath = './lib/esm-ext-mjs/index.mjs';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stdout).toBe(output);
					expect(nodeProcess.stderr).not.toMatch('Obsolete loader hook');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
				});

				test('TypeScript Import', async () => {
					const nodeProcess = await node.import(importPath, { typescript: true });
					expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
				});
			});

			describe('extensionless - should not work', ({ test }) => {
				const importPath = './lib/esm-ext-mjs/index';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stderr).toMatch('Cannot find module');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stderr).toMatch('Cannot find module');
				});
			});

			describe('directory - should not work', ({ test }) => {
				const importPath = './lib/esm-ext-mjs';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stderr).toMatch('Cannot find module');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stderr).toMatch('Cannot find module');
				});
			});
		});

		describe('.js extension', ({ describe }) => {
			const output = 'loaded esm-ext-js/index.js {"nodePrefix":true,"hasDynamicImport":true,"nameInError":true,"sourceMap":true}';

			describe('full path', ({ test }) => {
				const importPath = './lib/esm-ext-js/index.js';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stdout).toBe(output);
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);

					expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
				});
			});

			describe('extensionless', ({ test }) => {
				const importPath = './lib/esm-ext-js/index';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stdout).toBe(output);
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
				});
			});

			describe('directory', ({ test }) => {
				const importPath = './lib/esm-ext-js';

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.stdout).toBe(output);
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);

					expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
				});
			});
		});
	});
});
