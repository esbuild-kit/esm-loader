import { testSuite, expect } from 'manten';
import type { NodeApis } from '../../utils/node-with-loader';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.ts extension', ({ describe }) => {
		const output = 'loaded ts-ext-ts/index.ts {"nodePrefix":true,"hasDynamicImport":true,"nameInError":true,"sourceMap":true}';

		describe('full path', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.ts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stdout).toBe(output);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
			});
		});

		describe('full path via .js', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.js';

			test('Load - should not work', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath, { typescript: true });
				expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
			});
		});

		describe('extensionless', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stdout).toBe(output);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
			});
		});

		describe('extensionless with subextension', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.tsx';
			const outputSubextension = 'loaded ts-ext-ts/index.tsx.ts {"nodePrefix":true,"hasDynamicImport":true,"nameInError":true,"sourceMap":true}';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stdout).toBe(outputSubextension);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toBe(`${outputSubextension}\n{"default":1234}`);
			});
		});

		describe('directory', ({ test }) => {
			const importPath = './lib/ts-ext-ts';

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
