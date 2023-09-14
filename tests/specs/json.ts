import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { outdent } from 'outdent';
import type { NodeApis } from '../utils/node-with-loader.js';

const jsonFixture = {
	'package.json': JSON.stringify({
		type: 'module',
	}),
	'index.json': JSON.stringify({
		loaded: 'json',
	}),
};

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('JSON', async ({ describe, onFinish }) => {
		const fixture = await createFixture(jsonFixture);

		onFinish(async () => await fixture.rm());

		describe('full path', ({ test }) => {
			test('Load', async () => {
				const nodeProcess = await node.loadFile(fixture.path, './index.json');
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.importFile(fixture.path, './index.json');
				expect(nodeProcess.stdout).toMatch(
					outdent`
					[Module: null prototype] {
					  default: { loaded: 'json' },
					  loaded: 'json'
					}`,
				);
			});
		});

		describe('extensionless', ({ test }) => {
			test('Load', async () => {
				const nodeProcess = await node.loadFile(fixture.path, './index');
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.importFile(fixture.path, './index');
				expect(nodeProcess.stdout).toMatch(
					outdent`
					[Module: null prototype] {
					  default: { loaded: 'json' },
					  loaded: 'json'
					}`,
				);
			});
		});

		describe('directory', ({ test }) => {
			test('Load', async ({ onTestFail }) => {
				const nodeProcess = await node.loadFile(fixture.path, '.');
				onTestFail(() => {
					console.log(nodeProcess);
				});
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.importFile(fixture.path, '.');
				expect(nodeProcess.stdout).toMatch(
					outdent`
					[Module: null prototype] {
					  default: { loaded: 'json' },
					  loaded: 'json'
					}`,
				);
			});
		});

		describe('ambiguous path', async ({ describe, onFinish }) => {
			const fixture = await createFixture({
				...jsonFixture,
				index: {
					file: '',
				},
			});

			onFinish(async () => await fixture.rm());

			describe('ambiguous path to directory should fallback to file', async ({ test }) => {
				test('Load', async () => {
					const nodeProcess = await node.loadFile(fixture.path, './index');
					expect(nodeProcess.exitCode).toBe(0);
					expect(nodeProcess.stdout).toBe('');
				});

				test('Import', async () => {
					const nodeProcess = await node.importFile(fixture.path, './index');
					expect(nodeProcess.stdout).toMatch(
						outdent`
						[Module: null prototype] {
						  default: { loaded: 'json' },
						  loaded: 'json'
						}`,
					);
				});
			});

			describe('explicit directory should not fallback to file', ({ test }) => {
				test('Import', async () => {
					const nodeProcess = await node.importFile(fixture.path, './index/');
					expect(nodeProcess.stderr).toMatch('ERR_MODULE_NOT_FOUND');
				});
			});
		});
	});
});
