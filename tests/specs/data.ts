import { testSuite, expect } from 'manten';
import type { NodeApis } from '../utils/node-with-loader';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('data', async ({ test }) => {
		const importPath = './lib/data/index.js';

		test('Loads data URLs', async () => {
			const nodeProcess = await node.load(importPath);

			expect(nodeProcess.exitCode).toBe(0);
			expect(nodeProcess.stdout).toMatch('123');
		});

	});
});
