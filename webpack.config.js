const path = require('path');
const webpack = require('webpack');

var loaders = [{
	"test": /\.js?$/,
	"exclude": [
		path.resolve(__dirname, "node_modules"),
		path.resolve(__dirname, "src/libCustom")
	],
	"loader": "babel-loader",
	"query": {
		"presets": [[
			"env",
			{
				"targets": {
					"browsers": ["last 2 versions"]
				}
			}
		]]
	}
}, {
	test: /\.(css)$/,
	use: [
		'style-loader',
		'css-loader'
	]
}, {
	test: /\.html$/,
	use: [{
		loader: 'html-loader',
		options: {
			minimize: true
		}
	}],
}, {
	test: /\.(jpg|png|svg)$/,
	loader: 'file-loader',
	options: {
		outputPath: 'images/'
	}
}, { test: /\.(png|woff|woff2|eot|ttf|svg)$/, loader: 'url-loader' }];

module.exports = {
	entry: ['babel-polyfill', './src/saiv.js'],
	output: {
		filename: './bundle.js',
		path: path.resolve(__dirname, 'www')
	},
	module: {
		loaders: loaders
	},
	plugins: [
		new webpack.ProvidePlugin({
			$: 'jquery',
			jQuery: 'jquery',
			'window.jQuery': 'jquery',
			Popper: ['popper.js', 'default']
		})
	]
};
