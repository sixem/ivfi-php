/** Package information */
import pck from './package.json' assert {
	type: 'json'
};

/** Build helpers */
import build from './build.helpers.js';

/** Webpack plugins */
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';

/** Developer imports */
import webpack from 'webpack';
import moment from 'moment';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

/** Directory name and file name constants */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Read build.options.js if it exists
 */
 let buildOptions = build.readJson('./build.options.json');

/**
 * Set asset output directory (containing .js and .css files etc.)
 * 
 * (!) Can be set in `build.options.json`
 */
let assetDir = buildOptions && buildOptions.assetDir ? buildOptions.assetDir : 'indexer';

/** Trim any leading and trailing slash as well as double slashes */
assetDir = assetDir.replace(/([^:]\/)\/+/g, '$1').replace(/^\/|\/$/g, '');

/**
 * Parameters passed with `HtmlWebpackPlugin`
 */
let templateParameters = {
	buildInject: {},
	additonalCss: [],
	version: pck.version,
	indexerPath : `/${assetDir}/`
};

if(buildOptions)
{
	console.info('Build options:', JSON.stringify(buildOptions, null, 2), '\n');
} else {
	console.info('No build options was found - skipping any potential build options during the build.\n');
}

/**
 * Handle any extra build features
 */
if(buildOptions.extraFeatures)
{
	Object.keys(buildOptions.extraFeatures).forEach((key) =>
	{
		/** Is this feature enabled? */
		if(buildOptions.extraFeatures[key] === true)
		{
			/** Construct path, read the feature's JSON data */
			let path = `${buildOptions.extrasDir}/${key}`, data = build.readJson(`${path}/data.json`);

			if(data && data.integral && Object.keys(data.integral).length > 0)
			{
				let integrals = data.integral;

				/** Iterate over the feature's parts/snippets, read it and so on */
				Object.keys(integrals).forEach((part) =>
				{
					let relativePath = build.trimPartPath(integrals[part].path);
					let extractor = integrals[part].extractor;
					let partType = integrals[part].type || 'buildInject';

					let fullPath = `${path}/${relativePath}`;

					let options = typeof integrals[part].options === 'object' &&
						integrals[part].options !== null ? integrals[part].options : {};

					if(build.extractors.hasOwnProperty(extractor))
					{
						let integral = build.extractors[extractor](fullPath, options);

						/** If reading was successful - set injection values */
						if(integral)
						{
							if(partType === 'additonalCss')
							{
								templateParameters[partType].push(integral);
							} else {
								if(!templateParameters[partType].hasOwnProperty(key))
								{
									templateParameters[partType][key] = {};
								}
		
								templateParameters[partType][key][part] = integral;
							}
						}
					} else {
						build.exit('Extractor ', `'${extractor}'`, 'was not found.');
					}
				});
			}
		}
	});
}

const banner = () =>
{
	return `
	@preserved


	## IVFi-PHP - ${pck.description} ##


	[Version: ${pck.version}]

	[Git: https://github.com/sixem/ivfi-php]

	[Build: [fullhash] @ ${moment().format('dddd, MMMM Do YYYY')}]

	[Chunkhash: [chunkhash]]


	Copyright (c) 2022 emy | five.sh | github.com/sixem

	Licensed under GPL-3.0
	\n`;
};

const config = (env, argv) => {
	const isProduction = argv.mode === 'production';

	return {
		context: __dirname,
		mode: isProduction ? 'production' : 'development',
		entry: {
			index: './src/core/main.ts'
		},
		resolve: {
			extensions: ['.js', '.ts', '.json']
		},
		output: {
			filename: 'main.js',
			path: __dirname + `/build/${assetDir}`
		},
		optimization: {
			minimize: isProduction ? true : false,
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
				template: __dirname + '/src/php/template.php',
				filename: __dirname + '/build/indexer.php',
				templateParameters: () => {
					return templateParameters;
				}
			}),
			new MiniCssExtractPlugin({
				filename: `./css/style.css`
			}),
			new webpack.BannerPlugin({
				banner: banner(),
				entryOnly: true
			}),
		],
		module: {
			rules: [
				{
					test: /\.tsx?$/,
					loader: 'ts-loader'
				},
				{
					test: /\.s[ac]ss$/i,
					use: [
						MiniCssExtractPlugin.loader,
						{
							loader: 'css-loader',
							options: {
								sourceMap: isProduction ? false : true
							}
						},
						{
							loader: 'sass-loader'
						},
						{
							loader: 'postcss-loader'
						}
					],
				},
				{
					test: /\.(woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
					use: [
						{
							loader: 'file-loader',
							options: {
								name: 'assets/fonts/[name].[ext]',
								publicPath: `/${assetDir}`
							}
						}
					]
				}
			]
		}
	}
};

export default config;