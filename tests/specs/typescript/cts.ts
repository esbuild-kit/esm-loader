import { testSuite, expect } from 'manten';
import type { NodeApis } from '../../utils/node-with-loader';

const isWin = process.platform === 'win32';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.cts extension', ({ describe }) => {
		describe('full path', ({ test }) => {
			const importPath = './lib/ts-ext-cts/index.cts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.exitCode).toBe(1);

				/**
				 * Since .cts compiles to CJS and can use features like __dirname,
				 * it must be compiled by the CJS loader, which is enhanced via
				 * cjs-loader.
				 */
				expect(nodeProcess.stderr).toMatch('SyntaxError: Cannot use import statement outside a module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stderr).toMatch('SyntaxError: Cannot use import statement outside a module');
			});
		});

		describe('full path via .cjs', ({ test }) => {
			const importPath = './lib/ts-ext-cts/index.cjs';

			test('Load - should not work', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath, { typescript: true });
				expect(nodeProcess.stderr).toMatch('SyntaxError: Cannot use import statement outside a module');
			});
		});

		describe('extensionless - should not work', ({ test }) => {
			const importPath = './lib/ts-ext-cts/index';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
				expect(nodeProcess.stderr).toMatch(
					isWin
						? '\\lib\\ts-ext-cts\\index\''
						: '/lib/ts-ext-cts/index\'',
				);
			});
		});

		describe('directory - should not work', ({ test }) => {
			const importPath = './lib/ts-ext-cts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stderr).toMatch('Cannot find module');
				expect(nodeProcess.stderr).toMatch(
					isWin
						? '\\lib\\ts-ext-cts\''
						: '/lib/ts-ext-cts\'',
				);
			});
		});
	});
});
