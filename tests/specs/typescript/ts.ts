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
						'package.json': JSON.stringify({ type: 'module' }),
						'import.js': importAndLog('./file.js'),
						'file.ts': tsFile,
						'tsconfig.json': JSON.stringify({
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

				describe('without allowJs - empty tsconfig.json', async ({ test }) => {
					const fixture = await createFixture({
						'package.json': JSON.stringify({ type: 'module' }),
						'import.js': importAndLog('./file.js'),
						'file.ts': tsFile,
						'tsconfig.json': '{}',
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

				describe('without allowJs - no tsconfig.json', async ({ test }) => {
					const fixture = await createFixture({
						'package.json': JSON.stringify({ type: 'module' }),
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

			describe('From TypeScript file', ({ describe }) => {
				describe('with allowJs', async ({ test }) => {
					const fixture = await createFixture({
						'package.json': JSON.stringify({ type: 'module' }),
						'import.ts': importAndLog('./file.js'),
						'file.ts': tsFile,
						'tsconfig.json': JSON.stringify({
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

				describe('without allowJs - empty tsconfig.json', async ({ test }) => {
					const fixture = await createFixture({
						'package.json': JSON.stringify({ type: 'module' }),
						'import.ts': importAndLog('./file.js'),
						'file.ts': tsFile,
						'tsconfig.json': '{}',
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

				describe('without allowJs - no tsconfig.json', async ({ test }) => {
					const fixture = await createFixture({
						'package.json': JSON.stringify({ type: 'module' }),
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
