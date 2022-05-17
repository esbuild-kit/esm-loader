import { testSuite, expect } from 'manten';
import type { NodeApis } from '../../utils/node-with-loader';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.ts extension', ({ describe }) => {
		const output = 'loaded ts-ext-ts/index.ts true true true';

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
