(function (param) {
	param = 2;
	const isStrictMode = arguments[0] !== 2;
	console.log(isStrictMode ? 'strict mode' : 'not strict mode');
})(1);
