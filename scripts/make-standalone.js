const package = require('../package.json');

const fs = require('fs');
const path = require('path');

const data = {
	outFile : './build/standalone.php'
};

let stripComments = (source) =>
{
	return source.replace(/(\/\*(?:(?!\*\/).|[\n\r])*\*\/)/, '');
}

let minifiedBanner = () =>
{
	return `
/*!
 * IVFi-PHP - ${package.description} (${package.version})
 *
 * [https://github.com/sixem/ivfi-php]
 *
 * Copyright (c) 2022 emy | five.sh | github.com/sixem
 * Licensed under GPL-3.0
 */
 `;
}

let replaceScriptTags = (binary) =>
{
	let matches = /(<script defer type="[a-z\/]+" src="\/([a-z]+\/[a-z]+\.js)(.+)"><\/script>)/g.exec(binary);

	let output = new String();

	if(matches)
	{
		/* create .js file path */
		let filePath = `./build/${matches[2]}`;

		if(fs.existsSync(filePath))
		{
			console.log('\nReading script', '->', filePath);

			/* read .js file */
			let script = fs.readFileSync(filePath, 'binary');

			/* remove script tag */
			binary = binary.replace(matches[1], new String());

			/* add full script to output */
			output += `<script type="text/javascript">\n${minifiedBanner()}\n${stripComments(script)}</script>`;
		} else {
			throw new Error(`Unexisting asset file (${filePath}).`);
		}
	}

	return [binary, output];
}

let replaceStyleTags = (binary) =>
{
	let matches = /(\'<link rel="[a-z\/]+" type="text\/css" href="\/([a-z]+\/css\/[a-z]+\.css)(.+)">\')/g.exec(binary);

	if(matches)
	{
		let filePath = `./build/${matches[2]}`;

		if(fs.existsSync(filePath))
		{
			console.log('\nReading stylesheet', '->', filePath);

			/* read .css file */
			let sheet = fs.readFileSync(filePath, 'utf-8');

			let fonts = sheet.match(new RegExp(/(src\:\ ?url\(([A-Za-z0-9\.\/\-]+)\) format\("[A-Za-z0-9]+"\)\;)/g));

			console.log('Found', fonts.length, 'font assets');

			(fonts).forEach((font) =>
			{
				/* join asset path */
				const fontPath = path.join('./build', (font.split('url(')[1]).split(')')[0]);

				if(fs.existsSync(fontPath))
				{
					console.log('Processing ->', fontPath);

					/* read font as base64 */
					let based = fs.readFileSync(fontPath, {
						encoding : 'base64'
					});

					/* replace css font with base64 */
					sheet = sheet.replace(font, `src: url(data:application/font-woff2;charset=utf-8;base64,${based});`);
				} else {
					throw new Error(`Unexisting asset file (${fontPath}).`);
				}
			});

			binary = binary.replace(matches[1], `'<style type="text/css">${stripComments(sheet).replace(/[\']/g, `${String.fromCharCode(92)}\'`)}</style>'`);
		} else {
			throw new Error(`Unexisting asset file (${filePath}).`);
		}
	}

	return binary;
}

console.log('Building standalone ..');

try
{
	console.log('\nReading index ..');

	/* read php index */
	let source = fs.readFileSync('./build/indexer.php', 'binary');

	/* replace script tags, return stripped source and script data */
	let [binary, scripts] = replaceScriptTags(source);

	/* set source without script tags */
	source = binary;

	/* split source by line */
	let lines = source.split('\n');

	/* iterate over lines */
	for(let i = 0; i < lines.length; i++)
	{
		let line = lines[i];

		/* check if line is ending body */
		if(line.includes('</body>'))
		{
			/* insert script data before ending body (can't use defer in standalone) */
			lines.splice(i - 1, 0, scripts);

			console.log('Inserting scripts at line', i - 1);

			/* break loop */
			break;
		}
	}

	/* create new source with inserted script data */
	source = lines.join('\n');

	/* replace stylesheets with raw css */
	source = replaceStyleTags(source);

	console.log('\nWriting to', data.outFile);

	/* write output */
	fs.writeFileSync(data.outFile, source);

	/* get output stats */
	let stats = fs.statSync(data.outFile)

	console.log(`OK .. ${stats.size} (${Math.round(((stats.size / (1024)) + Number.EPSILON) * 100) / 100} kB)`);
} catch(error)
{
	console.error(error);

	process.exit(1);
}