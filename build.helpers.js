import fs from 'fs';

/**
 * Strips the opening/closing tags from code.
 * @param {*} data 
 * @param {*} tags 
 * @returns 
 */
const stripOuterTags = (data, tags) =>
{
    let lines = data.split('\n');
    let modified = false;

    for(let i = 0; i < lines.length; i++)
    {
        if(lines[i].startsWith(tags[0]))
        {
            lines.splice(i, 1);
            modified = true;

            break;
        }
    }

    if(modified)
    {
        for(let i = lines.length - 1; i >= 0; i--)
        {
            if(lines[i].startsWith(tags[1]))
            {
                lines.splice(i, 1);
                break;
            }
        }

        data = lines.join('\n');
    }

    return data;
};

const exit = (...message) =>
{
	console.log(`\nExiting -`, ...message);
	process.exit(1);
}

/**
 * Reads the JSON data from a path
 * 
 * @param {string} path 
 */
const readJson = (path) =>
{
	let data = false;

	try
	{
		if(fs.existsSync(path))
		{
			data = JSON.parse(fs.readFileSync(path));
		} else {
			exports.exit(`File not found: ${path}`);
		}
	} catch(error) {
		exports.exit(`Error reading: ${path}`, error);
		data = null;
	}

	return data;
};

/**
 * Extractors for fetching/reading extra build files
 */
const extractors = {
	filePhp: (path, options = {}) =>
	{
		let data = null;

		try
		{
			if(fs.existsSync(path))
			{
				let buffer = fs.readFileSync(path);
                data = buffer.toString();

                if(options.stripTags)
                {
                    data = stripOuterTags(data, ['<?php', '?>']);
                }
			} else {
				exports.exit(`File not found: ${path}`);
			}
		} catch(error) {
			exports.exit(`Extraction failed @ ${path}`, error);
		}
	
		return data;
	},
    fileCss: (path, options = {}) =>
    {
		let data = null;

		try
		{
			if(fs.existsSync(path))
			{
				let buffer = fs.readFileSync(path);
                data = buffer.toString();

                if(options.minimize)
                {
                    data = data.
                        replace(/\n/g, '').
                        replace(/\s\s+/g, ' ').
                        replace(/"/g, '\\"').
                        replace(': ', ':').replace('; ', ';').
                        replace(' }', '}').replace('} ', '}').
                        replace('{ ', '{').replace(' {', '{');
                }
			} else {
				exports.exit(`File not found: ${path}`);
			}
		} catch(error) {
			exports.exit(`Extraction failed @ ${path}`, error);
		}
	
		return data;
    }
};

const trimPartPath = (path) =>
{
    if(path[0] === '/' || path[0] === '\\')
    {
        path = path.substring(1);
    } else if(path.substring(0, 2) === './')
    {
        path = path.substring(2);
    }

    return path;
};

export default {
    exit,
    readJson,
    extractors,
    trimPartPath
};