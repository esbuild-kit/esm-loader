import { testSuite, expect } from 'manten';
import type { NodeApis } from '../utils/node-with-loader';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('JSON', async ({ describe }) => {
		describe('full path', ({ test }) => {
			const importPath = './lib/json/index.json';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toMatch('{"default":{"loaded":"json"},"loaded":"json"}');
			});
		});

		describe('extensionless', ({ test }) => {
			const importPath = './lib/json/index';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toMatch('{"default":{"loaded":"json"},"loaded":"json"}');
			});
		});

		describe('directory', ({ test }) => {
			const importPath = './lib/json';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toMatch('{"default":{"loaded":"json"},"loaded":"json"}');
			});
		});
	});
});
