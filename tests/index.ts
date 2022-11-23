import { describe } from 'manten';
import { createNode } from './utils/node-with-loader';

const nodeVersions = [
	'12.20.0', // CJS named export detection added
	'12.22.11',
	...(
		process.env.CI
			? [
				'14.21.1',
				'16.18.1',
				'17.9.1',
				'18.12.1',
			]
			: []
	),
];

(async () => {
	for (const nodeVersion of nodeVersions) {
		await describe(`Node ${nodeVersion}`, async ({ describe, runTestSuite }) => {
			describe('Package: module', async ({ runTestSuite }) => {
				const node = await createNode(nodeVersion, './tests/fixtures/package-module');

				runTestSuite(
					import('./specs/javascript'),
					node,
				);
				runTestSuite(
					import('./specs/typescript'),
					node,
				);
				runTestSuite(
					import('./specs/json'),
					node,
				);
			});

			runTestSuite(
				import('./specs/package-cjs'),
				await createNode(nodeVersion, './tests/fixtures/package-commonjs'),
			);
		});
	}
})();
