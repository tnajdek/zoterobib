const presets = [
	["@babel/preset-env", {
		"debug": !!process.env.DEBUG || false,
	}],
	['@babel/preset-react', {
		'runtime': 'automatic',
		'development': process.env.NODE_ENV === 'development',
		'importSource': process.env.NODE_ENV === 'development' ? '@welldone-software/why-did-you-render' : undefined,
	}],
];

const plugins = [
	["babel-plugin-polyfill-corejs3", {
		"method": "usage-global",
		"version": "3.49",
	}],
];


module.exports = { presets, plugins };
