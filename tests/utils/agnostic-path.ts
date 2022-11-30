const isWin = process.platform === 'win32';

export const agnosticPath = (path: string) => (
	isWin
		? path.replace(/\//g, '\\')
		: path
);
