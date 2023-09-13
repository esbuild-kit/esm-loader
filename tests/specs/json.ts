import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import type { NodeApis } from '../utils/node-with-loader.js';

export default testSuite(async ({ describe }, node: NodeApis) => {
	describe('JSON', async ({ describe, onFinish }) => {
		const fixture = await createFixture({
			'index.json': JSON.stringify({
				loaded: 'json',
			}),
		});

		onFinish(async () => await fixture.rm());

		describe('full path', ({ test }) => {
			const importPath = path.join(fixture.path, 'index.json');

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toMatch('{"default":{"loaded":"json"},"loaded":"json"}');
			});
		});

		describe('extensionless', ({ test }) => {
			const importPath = path.join(fixture.path, 'index');

			test('Load', async () => {
				const nodeProcess = await node.load(importPath);
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async ({ onTestFail }) => {
				const nodeProcess = await node.import(importPath);
				onTestFail(() => {
					console.log(nodeProcess);
				});
				expect(nodeProcess.stdout).toMatch('{"default":{"loaded":"json"},"loaded":"json"}');
			});
		});

		describe('directory', ({ test }) => {
			const importPath = fixture.path;

			test('Load', async ({ onTestFail }) => {
				const nodeProcess = await node.load(importPath);
				onTestFail(() => {
					console.log(nodeProcess);
				});
				expect(nodeProcess.exitCode).toBe(0);
				expect(nodeProcess.stdout).toBe('');
			});

			test('Import', async () => {
				const nodeProcess = await node.import(importPath);
				expect(nodeProcess.stdout).toMatch('{"default":{"loaded":"json"},"loaded":"json"}');
			});
		});

		describe('ambiguous path', async ({ describe, onFinish }) => {
			const fixture = await createFixture({
				'index.json': JSON.stringify({
					loaded: 'json',
				}),
				index: {
					file: '',
				},
			});

			onFinish(async () => await fixture.rm());

			describe('ambiguous path to directory should fallback to file', async ({ test }) => {
				const importPath = path.join(fixture.path, 'index');

				test('Load', async () => {
					const nodeProcess = await node.load(importPath);
					expect(nodeProcess.exitCode).toBe(0);
					expect(nodeProcess.stdout).toBe('');
				});

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stdout).toMatch('{"default":{"loaded":"json"},"loaded":"json"}');
				});
			});

			describe('explicit directory should not fallback to file', ({ test }) => {
				const importPath = path.join(fixture.path, 'index/');

				test('Import', async () => {
					const nodeProcess = await node.import(importPath);
					expect(nodeProcess.stderr).toMatch('ERR_MODULE_NOT_FOUND');
				});
			});
		});
	});
});
