import fs from 'fs/promises';
import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import type { NodeApis } from '../../utils/node-with-loader.js';
import { assertNotFound } from '../../utils/assertions.js';
import { importAndLog, tsconfigJson } from '../../utils/fixtures.js';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.cts extension', ({ describe }) => {
		describe('full path', ({ test }) => {
			const importPath = './lib/ts-ext-cts/index.cts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.exitCode).toBe(1);

				/**
				 * Since .cts compiles to CJS and can use features like __dirname,
				 * it must be compiled by the CJS loader
				 */
				expect(nodeProcess.stderr).toMatch('SyntaxError: Unexpected token \':\'');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stderr).toMatch('SyntaxError: Unexpected token \':\'');
			});
		});

		describe('full path via .cjs', async ({ describe }) => {
			const ctsFile = await fs.readFile('./tests/fixtures/package-module/lib/ts-ext-cts/index.cts', 'utf8');

			describe('From JavaScript file', ({ describe }) => {
				describe('with allowJs', async ({ test, onFinish }) => {
					const fixture = await createFixture({
						'import.mjs': importAndLog('./file.cjs'),
						'file.cts': ctsFile,
						'tsconfig.json': tsconfigJson({
							compilerOptions: {
								allowJs: true,
							},
						}),
					});

					onFinish(async () => await fixture.rm());

					test('Load - should not work', async () => {
						const nodeProcess = await node.load('./file.cjs', {
							cwd: fixture.path,
						});
						assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
					});

					test('Import', async () => {
						const nodeProcess = await node.load('import.mjs', {
							cwd: fixture.path,
						});
						expect(nodeProcess.stderr).toMatch('SyntaxError: Unexpected token \':\'');
					});
				});

				describe('without allowJs', ({ describe }) => {
					describe('empty tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mjs': importAndLog('./file.cjs'),
							'file.cts': ctsFile,
							'tsconfig.json': '{}',
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.cjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
						});
					});

					describe('no tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mjs': importAndLog('./file.cjs'),
							'file.cts': ctsFile,
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.cjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.mjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
						});
					});
				});
			});

			describe('From TypeScript file', ({ describe }) => {
				describe('with allowJs', async ({ test, onFinish }) => {
					const fixture = await createFixture({
						'import.mts': importAndLog('./file.cjs'),
						'file.cts': ctsFile,
						'tsconfig.json': tsconfigJson({
							compilerOptions: {
								allowJs: true,
							},
						}),
					});

					onFinish(async () => await fixture.rm());

					test('Load - should not work', async () => {
						const nodeProcess = await node.load('./file.cjs', {
							cwd: fixture.path,
						});
						assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
					});

					test('Import', async () => {
						const nodeProcess = await node.load('import.mts', {
							cwd: fixture.path,
						});
						expect(nodeProcess.stderr).toMatch('SyntaxError: Unexpected token \':\'');
					});
				});

				describe('without allowJs', ({ describe }) => {
					describe('empty tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mts': importAndLog('./file.cjs'),
							'file.cts': ctsFile,
							'tsconfig.json': '{}',
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.cjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.mts', {
								cwd: fixture.path,
							});
							expect(nodeProcess.stderr).toMatch('SyntaxError: Unexpected token \':\'');
						});
					});

					describe('no tsconfig.json', async ({ test, onFinish }) => {
						const fixture = await createFixture({
							'import.mts': importAndLog('./file.cjs'),
							'file.cts': ctsFile,
						});

						onFinish(async () => await fixture.rm());

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.cjs', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.cjs'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.mts', {
								cwd: fixture.path,
							});
							expect(nodeProcess.stderr).toMatch('SyntaxError: Unexpected token \':\'');
						});
					});
				});
			});
		});

		describe('extensionless - should not work', ({ test }) => {
			const importPath = './lib/ts-ext-cts/index';

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
			const importPath = './lib/ts-ext-cts';

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
