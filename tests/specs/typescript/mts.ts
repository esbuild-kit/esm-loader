import { testSuite, expect } from 'manten';
import type { NodeApis } from '../../utils/node-with-loader';

const isWin = process.platform === 'win32';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.mts extension', ({ describe }) => {
		const output = 'loaded ts-ext-mts/index.mts {"nodePrefix":true,"hasDynamicImport":true,"nameInError":true,"sourceMap":true}';

		describe('full path', ({ test }) => {
			const importPath = './lib/ts-ext-mts/index.mts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stdout).toBe(output);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
			});
		});

		describe('full path via .mjs', ({ test }) => {
			const importPath = './lib/ts-ext-mts/index.mjs';

			test('Load - should not work', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath, { typescript: true });
				expect(nodeProcess.stdout).toBe(`${output}\n{"default":1234}`);
			});
		});

		describe('extensionless - should not work', ({ test }) => {
			const importPath = './lib/ts-ext-mts/index';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
				expect(nodeProcess.stderr).toMatch(
					isWin
						? '\\lib\\ts-ext-mts\\index\''
						: '/lib/ts-ext-mts/index\'',
				);
			});
		});

		describe('directory - should not work', ({ test }) => {
			const importPath = './lib/ts-ext-mts/';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
				expect(nodeProcess.stderr).toMatch(
					isWin
						? '\\lib\\ts-ext-mts\\\''
						: '/lib/ts-ext-mts/\'',
				);
			});
		});
	});
});
