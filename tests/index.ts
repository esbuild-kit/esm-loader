import { describe } from 'manten';
import { createNode } from './utils/node-with-loader.js';

const nodeVersions = [
	'18.12.1',
	// '12.20.0', // CJS named export detection added
	// '12.22.11',
	// ...(
	// 	process.env.CI
	// 		? [
	// 			'14.21.1',
	// 			'16.18.1',
	// 			'17.9.1',
	// 			'18.12.1',
	// 		]
	// 		: []
	// ),
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
				runTestSuite(
					import('./specs/typescript/index.js'),
					node,
				);
				// runTestSuite(
				// 	import('./specs/json.js'),
				// 	node,
				// );
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
