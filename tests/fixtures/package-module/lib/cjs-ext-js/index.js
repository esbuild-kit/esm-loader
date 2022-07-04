console.log(
	'loaded cjs-ext-js/index.js',
	JSON.stringify({
		nodePrefix: Boolean(require('node:fs')),
		hasDynamicImport: Boolean(import('fs')),
		...(() => {
			let nameInError;
			try {
				nameInError();
			} catch (error) {
				return {
					nameInError: error.message.includes('nameInError'),
					sourceMap: error.stack.includes(':9:5'),
				};
			}
		})(),
	}),
);

module.exports = 1234;
