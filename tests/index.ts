import { describe } from 'manten';
import { createNode } from './utils/node-with-loader.js';

const nodeVersions = [
	// '20',
	...(
		(
			process.env.CI
			&& process.platform !== 'win32'
		)
			? [
				'12.20.0', // CJS named export detection added
				// '12',
				// '14',
				// '16',
				// '17',
				// '18',
			]
			: []
	),
];

(async () => {
	for (const nodeVersion of nodeVersions) {
		await describe(`Node ${nodeVersion}`, async ({ describe, runTestSuite }) => {
			describe('Package: module', async ({ runTestSuite }) => {
				const node = await createNode(nodeVersion, './tests/fixtures/package-module');

				// runTestSuite(
				// 	import('./specs/javascript/index.js'),
				// 	node,
				// );
				// runTestSuite(
				// 	import('./specs/typescript/index.js'),
				// 	node,
				// );
				runTestSuite(
					import('./specs/json.js'),
					node,
				);
				// runTestSuite(
				// 	import('./specs/wasm.js'),
				// 	node,
				// );
				// runTestSuite(
				// 	import('./specs/data.js'),
				// 	node,
				// );
				// runTestSuite(
				// 	import('./specs/import-map.js'),
				// 	node,
				// );
			});

			// runTestSuite(
			// 	import('./specs/package-cjs.js'),
			// 	await createNode(nodeVersion, './tests/fixtures/package-commonjs'),
			// );
		});
	}
})();
