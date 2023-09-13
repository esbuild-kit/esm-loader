import fs from 'fs/promises';
import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import semver from 'semver';
import type { NodeApis } from '../../utils/node-with-loader.js';
import nodeSupports from '../../utils/node-supports.js';
import { assertNotFound } from '../../utils/assertions.js';
import { importAndLog, tsconfigJson } from '../../utils/fixtures.js';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.mts extension', ({ describe }) => {
		function assertResults(stdout: string) {
			expect(stdout).toMatch('loaded ts-ext-mts/index.mts');
			expect(stdout).toMatch('✖ has CJS context');
			expect(stdout).toMatch('✔ name in error');
			expect(stdout).toMatch('✔ sourcemaps');
			expect(stdout).toMatch('✔ resolves optional node prefix');
			expect(stdout).toMatch('✔ preserves names');
			expect(stdout).toMatch(
				semver.satisfies(node.version, nodeSupports.testRunner)
					? '✔ resolves required node prefix'
					: '✖ resolves required node prefix: Error [ERR_UNKNOWN_BUILTIN_MODULE]',
			);
		}

		describe('full path', ({ test }) => {
			const importPath = './lib/ts-ext-mts/index.mts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertResults(nodeProcess.stdout);
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});

		describe('full path via .mjs', async ({ describe }) => {
			const mtsFile = await fs.readFile('./tests/fixtures/package-module/lib/ts-ext-mts/index.mts', 'utf8');

			describe('From JavaScript file', ({ describe }) => {
				describe('with allowJs', async ({ test, onFinish }) => {
					const fixture = await createFixture({
						'import.mjs': importAndLog('./file.mjs'),
						'file.mts': mtsFile,
						'tsconfig.json': tsconfigJson({
							compilerOptions: {
								allowJs: true,
							},
						}),
					});

					onFinish(async () => await fixture.rm());

					test('Load - should not work', async () => {
						const nodeProcess = await node.load('./file.mjs', {
							cwd: fixture.path,
						});
						assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
					});

					test('Import', async () => {
						const nodeProcess = await node.load('import.mjs', {
							cwd: fixture.path,
						});
						assertResults(nodeProcess.stdout);
						expect(nodeProcess.stdout).toMatch('{"default":1234}');
					});
				});

				describe('without allowJs', ({ describe }) => {
					describe('empty tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mjs': importAndLog('./file.mjs'),
							'file.mts': mtsFile,
							'tsconfig.json': '{}',
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
						});

						test('Import - should not work', async () => {
							const nodeProcess = await node.load('import.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
						});
					});

					describe('no tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mjs': importAndLog('./file.mjs'),
							'file.mts': mtsFile,
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
						});

						test('Import - should not work', async () => {
							const nodeProcess = await node.load('import.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
						});
					});
				});
			});

			describe('From TypeScript file', ({ describe }) => {
				describe('with allowJs', async ({ test, onFinish }) => {
					const fixture = await createFixture({
						'import.mts': importAndLog('./file.mjs'),
						'file.mts': mtsFile,
						'tsconfig.json': tsconfigJson({
							compilerOptions: {
								allowJs: true,
							},
						}),
					});

					onFinish(async () => await fixture.rm());

					test('Load - should not work', async () => {
						const nodeProcess = await node.load('./file.mjs', {
							cwd: fixture.path,
						});
						assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
					});

					test('Import', async () => {
						const nodeProcess = await node.load('import.mts', {
							cwd: fixture.path,
						});
						assertResults(nodeProcess.stdout);
						expect(nodeProcess.stdout).toMatch('{"default":1234}');
					});
				});

				describe('without allowJs', ({ describe }) => {
					describe('empty tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mts': importAndLog('./file.mjs'),
							'file.mts': mtsFile,
							'tsconfig.json': '{}',
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.mts', {
								cwd: fixture.path,
							});
							assertResults(nodeProcess.stdout);
							expect(nodeProcess.stdout).toMatch('{"default":1234}');
						});
					});

					describe('no tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mts': importAndLog('./file.mjs'),
							'file.mts': mtsFile,
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.mts', {
								cwd: fixture.path,
							});
							assertResults(nodeProcess.stdout);
							expect(nodeProcess.stdout).toMatch('{"default":1234}');
						});
					});
				});
			});
		});

		describe('extensionless - should not work', ({ test }) => {
			const importPath = './lib/ts-ext-mts/index';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertNotFound(nodeProcess.stderr, importPath);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertNotFound(nodeProcess.stderr, importPath);
			});
		});

		describe('directory - should not work', ({ test }) => {
			const importPath = './lib/ts-ext-mts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertNotFound(nodeProcess.stderr, importPath);
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertNotFound(nodeProcess.stderr, importPath);
			});
		});
	});
});
