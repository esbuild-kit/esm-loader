function getStack() {
	let nameInSourceMaps;	
	try {
		nameInSourceMaps();
	} catch (error) {
		return {
			nameInError: error.message.includes('nameInSourceMaps'),
			sourceMap: error.stack.includes(':4:3'),
		};
	}
}

console.log(1, getStack());
