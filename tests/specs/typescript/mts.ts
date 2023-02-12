import fs from 'fs/promises';
import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import semver from 'semver';
import type { NodeApis } from '../../utils/node-with-loader';
import nodeSupports from '../../utils/node-supports';
import { assertNotFound } from '../../utils/assertions';
import { importAndLog } from '../../utils/fixtures';

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
			const mtsFile = './tests/fixtures/package-module/lib/ts-ext-mts/index.mts';

			describe('with allowJs', async ({ test }) => {
				const fixture = await createFixture({
					'index.mts': importAndLog('./file.mjs'),
					'file.mts': await fs.readFile(mtsFile, 'utf8'),
					'tsconfig.json': JSON.stringify({
						compilerOptions: {
							allowJs: true,
						},
					}),
				});

				test('Load - should not work', async () => {
					const nodeProcess = await node.load('./file.mjs', {
						cwd: fixture.path,
					});
					assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
				});

				test('Import', async () => {
					const nodeProcess = await node.load('index.mts', {
						cwd: fixture.path,
					});
					assertResults(nodeProcess.stdout);
					expect(nodeProcess.stdout).toMatch('{"default":1234}');
				});
			});

			describe('without allowJs - empty tsconfig.json', async ({ test }) => {
				const fixture = await createFixture({
					'index.mts': importAndLog('./file.mjs'),
					'file.mts': await fs.readFile(mtsFile, 'utf8'),
					'tsconfig.json': '{}',
				});

				test('Load - should not work', async () => {
					const nodeProcess = await node.load('./file.mjs', {
						cwd: fixture.path,
					});
					assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
				});

				test('Import', async () => {
					const nodeProcess = await node.load('index.mts', {
						cwd: fixture.path,
					});
					assertResults(nodeProcess.stdout);
					expect(nodeProcess.stdout).toMatch('{"default":1234}');
				});
			});

			describe('without allowJs - no tsconfig.json', async ({ test }) => {
				const fixture = await createFixture({
					'index.mts': importAndLog('./file.mjs'),
					'file.mts': await fs.readFile(mtsFile, 'utf8'),
				});

				test('Load - should not work', async () => {
					const nodeProcess = await node.load('./file.mjs', {
						cwd: fixture.path,
					});
					assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.mjs'));
				});

				test('Import', async () => {
					const nodeProcess = await node.load('index.mts', {
						cwd: fixture.path,
					});
					assertResults(nodeProcess.stdout);
					expect(nodeProcess.stdout).toMatch('{"default":1234}');
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
