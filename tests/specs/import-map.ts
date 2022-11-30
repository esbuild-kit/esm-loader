import { testSuite, expect } from 'manten';
import type { NodeApis } from '../utils/node-with-loader';
import { assertNotFound } from '../utils/assertions';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('Import map', ({ describe }) => {
		describe('Directory with star', ({ describe }) => {
			describe('Resolves directory', ({ test }) => {
				const importPath = '#directory-star';

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stdout).toMatch('loaded');
				});

				test('TypeScript Import', async () => {
					const nodeProcess = await node.import(importPath, { typescript: true });
					expect(nodeProcess.stdout).toMatch('loaded');
				});
			});

			describe('Resolves extension', ({ test }) => {
				const importPath = '#directory-star/index';

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stdout).toMatch('loaded');
				});

				test('TypeScript Import', async () => {
					const nodeProcess = await node.import(importPath, { typescript: true });
					expect(nodeProcess.stdout).toMatch('loaded');
				});
			});
		});

		describe('File with star', ({ describe }) => {
			describe('Resolves extension', ({ test }) => {
				const importPath = '#file-star';

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stdout).toMatch('loaded');
				});

				test('TypeScript Import', async () => {
					const nodeProcess = await node.import(importPath, { typescript: true });
					expect(nodeProcess.stdout).toMatch('loaded');
				});
			});
		});

		describe('Errors', ({ test }) => {
			test('Directory', async () => {
				const nodeProcess = await node.import('#directory');
				expect(nodeProcess.stderr).toMatch('ERR_UNSUPPORTED_DIR_IMPORT');
				expect(nodeProcess.stderr).toMatch('/lib/esm-ext-js\'');
			});

			test('Non-existent', async () => {
				const nodeProcess = await node.import('#non-existent');
				assertNotFound(nodeProcess.stderr, '/lib/non-existent');
			});
		});
	});
});
