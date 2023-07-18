import fs from 'fs/promises';
import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import semver from 'semver';
import type { NodeApis } from '../../utils/node-with-loader.js';
import nodeSupports from '../../utils/node-supports.js';
import { assertNotFound } from '../../utils/assertions.js';
import { importAndLog, packageJson, tsconfigJson } from '../../utils/fixtures.js';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('.ts extension', ({ describe }) => {
		function assertResults(stdout: string, filename = 'ts-ext-ts/index.ts') {
			expect(stdout).toMatch(`loaded ${filename}\n`);
			expect(stdout).toMatch('✖ has CJS context');
			expect(stdout).toMatch('✔ name in error');
			expect(stdout).toMatch('✔ sourcemaps');
			expect(stdout).toMatch('✔ has dynamic import');
			expect(stdout).toMatch('✔ resolves optional node prefix');
			expect(stdout).toMatch('✔ preserves names');
			expect(stdout).toMatch(
				semver.satisfies(node.version, nodeSupports.testRunner)
					? '✔ resolves required node prefix'
					: '✖ resolves required node prefix: Error [ERR_UNKNOWN_BUILTIN_MODULE]',
			);
		}

		describe('full path', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.ts';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout);
			});

			if (semver.satisfies(node.version, nodeSupports.nodePrefixRequire)) {
				test('Disables native source map if Error.prepareStackTrace is customized', async () => {
					const nodeProcess = await node.load(importPath, {
						nodeOptions: ['-r', 'source-map-support/register'],
					});
					assertResults(nodeProcess.stdout);
				});
			}

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertResults(nodeProcess.stdout);
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});

		describe('full path via .js', async ({ describe }) => {
			const tsFile = await fs.readFile('./tests/fixtures/package-module/lib/ts-ext-ts/index.ts', 'utf8');

			describe('From JavaScript file', ({ describe }) => {
				describe('with allowJs', async ({ test }) => {
					const fixture = await createFixture({
						'package.json': packageJson({ type: 'module' }),
						'import.js': importAndLog('./file.js'),
						'file.ts': tsFile,
						'tsconfig.json': tsconfigJson({
							compilerOptions: {
								allowJs: true,
							},
						}),
					});

					test('Load - should not work', async () => {
						const nodeProcess = await node.load('./file.js', {
							cwd: fixture.path,
						});
						assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
					});

					test('Import', async () => {
						const nodeProcess = await node.load('import.js', {
							cwd: fixture.path,
						});
						assertResults(nodeProcess.stdout);
						expect(nodeProcess.stdout).toMatch('{"default":1234}');
					});
				});

				describe('without allowJs', ({ describe }) => {
					describe('empty tsconfig.json', async ({ test }) => {
						const fixture = await createFixture({
							'package.json': packageJson({ type: 'module' }),
							'import.js': importAndLog('./file.js'),
							'file.ts': tsFile,
							'tsconfig.json': tsconfigJson({}),
						});

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.js', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.js', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
						});
					});

					describe('no tsconfig.json', async ({ test }) => {
						const fixture = await createFixture({
							'package.json': packageJson({ type: 'module' }),
							'import.js': importAndLog('./file.js'),
							'file.ts': tsFile,
						});

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.js', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.js', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
						});
					});
				});
			});

			describe('From TypeScript file', ({ describe }) => {
				describe('with allowJs', async ({ test }) => {
					const fixture = await createFixture({
						'package.json': packageJson({ type: 'module' }),
						'import.ts': importAndLog('./file.js'),
						'file.ts': tsFile,
						'tsconfig.json': tsconfigJson({
							compilerOptions: {
								allowJs: true,
							},
						}),
					});

					test('Load - should not work', async () => {
						const nodeProcess = await node.load('./file.js', {
							cwd: fixture.path,
						});
						assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
					});

					test('Import', async () => {
						const nodeProcess = await node.load('import.ts', {
							cwd: fixture.path,
						});
						assertResults(nodeProcess.stdout);
						expect(nodeProcess.stdout).toMatch('{"default":1234}');
					});
				});

				describe('without allowJs', ({ describe }) => {
					describe('excluded by tsconfig.json', async ({ test }) => {
						/**
						 * file.ts is technically excluded from tsconfig.json, but it should work
						 * becaue it's clearly from a TypeScript file
						 *
						 * In the future, we'll probably want to lookup a matching tsconfig for each file
						 * and not just pick one in cwd
						 */
						const fixture = await createFixture({
							'package.json': packageJson({ type: 'module' }),
							'import.ts': importAndLog('./file.js'),
							'file.ts': tsFile,
							'tsconfig.json': tsconfigJson({
								compilerOptions: {
									// TODO: add some configs that shouldnt get applied
								},
								exclude: ['*.ts'],
							}),
						});

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.js', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.ts', {
								cwd: fixture.path,
							});
							assertResults(nodeProcess.stdout);
							expect(nodeProcess.stdout).toMatch('{"default":1234}');
						});
					});

					describe('empty tsconfig.json', async ({ test }) => {
						const fixture = await createFixture({
							'package.json': packageJson({ type: 'module' }),
							'import.ts': importAndLog('./file.js'),
							'file.ts': tsFile,
							'tsconfig.json': tsconfigJson({}),
						});

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.js', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.ts', {
								cwd: fixture.path,
							});
							assertResults(nodeProcess.stdout);
							expect(nodeProcess.stdout).toMatch('{"default":1234}');
						});
					});

					describe('no tsconfig.json', async ({ test }) => {
						const fixture = await createFixture({
							'package.json': packageJson({ type: 'module' }),
							'import.ts': importAndLog('./file.js'),
							'file.ts': tsFile,
						});

						test('Load - should not work', async () => {
							const nodeProcess = await node.load('./file.js', {
								cwd: fixture.path,
							});
							assertNotFound(nodeProcess.stderr, path.join(fixture.path, 'file.js'));
						});

						test('Import', async () => {
							const nodeProcess = await node.load('import.ts', {
								cwd: fixture.path,
							});
							assertResults(nodeProcess.stdout);
							expect(nodeProcess.stdout).toMatch('{"default":1234}');
						});
					});
				});
			});
		});

		describe('extensionless', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index';

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

		describe('extensionless with subextension', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index.tsx';

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				assertResults(nodeProcess.stdout, 'ts-ext-ts/index.tsx.ts');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertResults(nodeProcess.stdout, 'ts-ext-ts/index.tsx.ts');
				expect(nodeProcess.stdout).toMatch('{"default":1234}');
			});
		});

		describe('directory', ({ test }) => {
			const importPath = './lib/ts-ext-ts';

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

		describe('empty directory should fallback to file', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index';

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

		describe('empty but explicit directory should not fallback to file', ({ test }) => {
			const importPath = './lib/ts-ext-ts/index/';

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				assertNotFound(nodeProcess.stderr, importPath);
			});
		});
	});
});
