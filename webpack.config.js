const package = require('./package.json');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const webpack = require('webpack');
const moment = require('moment');

const banner = () =>
{
	return `
	@preserved


	## eyy-indexer - ${package.description} ##


	[Version: ${package.version}]

	[Git: https://github.com/sixem/eyy-indexer]

	[Build: [fullhash] @ ${moment().format('dddd, MMMM Do YYYY')}]

	[Chunkhash: [chunkhash]]


	Copyright (c) 2022 emy | five.sh | github.com/sixem

	Licensed under GPL-3.0
	\n`;
};

module.exports = (env) => {
	return {
		context: __dirname,
		mode: env.production ? 'production' : 'development',
		entry: {
			index: './src/js/main.js'
		},
		output: {
			filename: 'main.js',
			path: __dirname + '/build/indexer/js'
		},
		optimization: {
			minimize: env.production ? true : false,
			minimizer: [
				new TerserPlugin({
					extractComments: false
				}),
				new CssMinimizerPlugin()
			]
		},
		plugins: [
			new HtmlWebpackPlugin({
				inject: false,
				minify: false,
				template: __dirname + '/src/php/index.php',
				filename: __dirname + '/build/indexer.php',
				templateParameters: (compilation) => {
					return {
						version: package.version,
						indexerPath : '/indexer/'
					}
				}
			}),
			new MiniCssExtractPlugin({
				filename: '../css/style.css'
			}),
			new webpack.BannerPlugin({
				banner: banner(),
				entryOnly: true
			}),
		],
		module: {
			rules: [
				{
					test: /\.css$/i,
					use: [MiniCssExtractPlugin.loader, 'css-loader']
				},
				{
					test: /\.(woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: '../assets/fonts/[name].[ext]'
							}
						}
					]
				}
			]
		}
	}
};