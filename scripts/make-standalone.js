/** Imports */
import fs from 'fs';
import path from 'path';

/** Data */
const data = {
	outFile : './build/standalone.php'
};

/**
 * Fired upon errors
 * 
 * @param {*} error 
 */
const onError = (error) =>
{
	console.error('FAILED:' + error);
	process.exit(1);
};

/**
 * Strips comments from a string
 * 
 * @param {string} source 
 */
const stripComments = (source) =>
{
	return source.replace(/(\/\*(?:(?!\*\/).|[\n\r])*\*\/)/, '');
};

/**
 * Scans the lines for a needle from a set index
 * 
 * @param {array}   lines 
 * @param {string}  needle 
 * @param {integer} fromIndex 
 * @param {boolean} reverse 
 */
const scanFromIndex = (lines, needle, fromIndex, reverse = false) =>
{
	let index = null;

	for(let i = fromIndex;
		reverse ? i > 0 : i < lines.length - 1;
		reverse ? i-- : i++
	){
		if(lines[i].includes(needle))
		{
			index = i; break;
		}
	}

	return index;
};

/**
 * Scans lines for a needle, finds the start and end of a block, removes it and returns the search item
 * The search item is expected to be within the block lines
 * 
 * @param {array}   lines 
 * @param {string}  needle 
 * @param {string}  start 
 * @param {string}  end 
 * @param {regexp}  itemSearch 
 * @param {boolean} removeComment 
 * @param {integer} limit 
 */
const spliceBySearch = (lines, needle, start, end, itemSearch, removeComment = true, limit = null) =>
{
	/** Indexes (lines) removed */
	let splicedIndexes = [];

	/** Items fetched from block(s) */
	let splicedItems = [];

	for(let i = (lines.length - 1); i > 0; i--)
	{
		if(lines[i].includes(needle))
		{
			/** Block start index */
			let startIndex = i;
			
			/** Find block start */
			const headerIndex = scanFromIndex(
				lines, start, startIndex, true
			);

			if(headerIndex !== null)
			{
				if(removeComment && lines[headerIndex - 1].includes('/*'))
					startIndex = (headerIndex - 1);

				/** Find block ending */
				const headerEnd = scanFromIndex(lines, end, headerIndex, false);

				if(headerEnd !== null)
				{
					for(let i = startIndex; i <= headerEnd; i++)
					{
						/** Check for item match */
						const matches = itemSearch.exec(lines[i]);

						if(matches)
						{
							/** Get all lines removed */
							const spliceSpan = [
								...Array((headerEnd + 1) - startIndex).keys()
							].map((i) => i + startIndex);
							
							/** Add to spliced indexes */
							splicedIndexes.push(...spliceSpan);
							splicedItems.push(matches[1]);

							break;
						}
					}
				}
			}
		}

		/** Check for limits */
		if(limit && splicedItems.length >= limit)
		{
			break;
		}
	}

	/** Remove spliced lines */
	for(let i = splicedIndexes.length -1; i >= 0; i--)
	{
		lines.splice(splicedIndexes[i],1);
	}

	return splicedItems.length > 0 ? {
		lines, items: splicedItems, indexes: splicedIndexes
	} : null;
};

console.log('Building standalone ..');

try
{
	console.log('\nReading index ..');

	/* Read PHP index */
	const source = fs.readFileSync('./build/indexer.php', 'utf-8');

	/* Split source by line */
	let lines = source.split('\n');

	/** Extract and remove scripts */
	const splicedScripts = spliceBySearch(
		lines,
		"'type' => 'text/javascript'", '$header[]', ');',
		/\'(\/[^\/\'\"]+\/main\.js)\?bust=%s\'/g
	);

	if(splicedScripts)
	{
		/** Update lines */
		lines = splicedScripts.lines;

		let scriptsData = [];

		/** Iterate over spliced scripts */
		for(const script of splicedScripts.items)
		{
			/** Construct script file relative */
			const scriptPath = script.split('/')[1];
			const scriptFile = `./build/${scriptPath}/${script.replace(`/${scriptPath}/`, '')}`;

			console.log('\nReading script', '->', scriptFile);

			if(fs.existsSync(scriptFile))
			{
				scriptsData.push(fs.readFileSync(scriptFile, 'binary'));
			} else {
				onError(`Script file: '${scriptFile}' does not exist!`);
			}
		}

		/** Get <body/> closing tag line */
		const bodyEnd = scanFromIndex(lines, '</body>', lines.length - 1, true);

		if(bodyEnd !== null)
		{
			/** Inject script data */
			lines.splice(bodyEnd - 1, 0, scriptsData.map((data) =>
			{
				return `<script type="text/javascript">${data}</script>`;
			}));
		}
	}

	/** Extract and remove stylesheets */
	const splicedStyles = spliceBySearch(
		lines,
		"$baseStylesheet", '$baseStylesheet', ');',
		/\"(\/[^\/\'\"]+\/css\/style\.css)\?bust=%s\"/g, 1
	);

	if(splicedStyles)
	{
		/** Update lines */
		lines = splicedStyles.lines;

		/** Construct stylesheet relative path */
		const stylePath = `./build/${splicedStyles.items[0]}`;

		console.log('\nReading stylesheet', '->', stylePath);

		if(fs.existsSync(stylePath))
		{
			/** Read stylesheet */
			let stylesheetData = stripComments(fs.readFileSync(stylePath, 'utf-8'));

			/** Find used fonts in stylesheet */
			const usedFonts = stylesheetData.match(
				new RegExp(/(src\:\ ?url\(([A-Za-z0-9\.\/\-]+)\) format\("[A-Za-z0-9]+"\)\;)/g)
			);

			console.log('Found', usedFonts.length, 'font asset(s)');

			/** Iterate over used fonts */
			for(const fontEntry of usedFonts)
			{
				/* Join asset path */
				const fontPath = path.join('./build', (fontEntry.split('url(')[1]).split(')')[0]);

				if(fs.existsSync(fontPath))
				{
					console.log('Processing ->', fontPath);

					/* Read font as Base64 and replace it with the stylesheet entry */
					stylesheetData = stylesheetData.replace(
						fontEntry, `src: url(data:application/font-woff2;charset=utf-8;base64,${fs.readFileSync(fontPath, {
							encoding: 'base64'
						})});`
					);
				} else {
					onError(`Font file: '${fontPath}' does not exist!`);
				}
			}

			lines.splice(
				Math.min(...splicedStyles.indexes), 0,
				`$baseStylesheet = '<style type="text/css">${
						stripComments(stylesheetData).replace(/[\']/g, `${String.fromCharCode(92)}\'`)
				}</style>';`
			);
		} else {
			onError(`Stylesheet file: '${stylePath}' does not exist!`);
		}
	}

	console.log('\nWriting to', data.outFile);

	/* write output */
	fs.writeFileSync(data.outFile, lines.join('\n'));

	/* get output stats */
	let stats = fs.statSync(data.outFile)

	console.log(`OK .. ${stats.size} (${Math.round(((stats.size / (1024)) + Number.EPSILON) * 100) / 100} kB)`);
} catch(error)
{
	onError(error);
}