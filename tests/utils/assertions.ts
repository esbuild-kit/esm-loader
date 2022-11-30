import { expect } from 'manten';

const isWin = process.platform === 'win32';

const agnosticPath = (path: string) => (
	isWin
		? path.replace(/\//g, '\\')
		: path
);

export const assertError = (
	stderr: string,
	error: string,
	modulePath: string,
) => {
	expect(stderr).toMatch(error);

	const nonRelativePath = modulePath.startsWith('.') ? modulePath.slice(1) : modulePath;
	expect(stderr).toMatch(agnosticPath(`${nonRelativePath}'`));
};

export const assertNotFound = (
	stderr: string,
	modulePath: string,
) => {
	assertError(stderr, 'ERR_MODULE_NOT_FOUND', modulePath);
};
