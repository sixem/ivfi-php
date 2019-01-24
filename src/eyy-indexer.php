<?php
class indexer
{
	CONST VERSION = '1.0.4';

	function __construct($path = '', $config = NULL)
	{
    	$this->newest = 0;

    	$this->error = $this->forbidden = false;

    	$this->currentPathSafe = '';

    	if($config !== NULL)
    	{
    		if(is_string($config) && is_file($config))
    		{
    			require_once($config); $this->configFile = $config;
    		}
    	}

    	$this->classDir = pathinfo(__FILE__, PATHINFO_DIRNAME);

		if(!isset($this->configFile) && !is_dir($this->classDir))
		{
			$this->classDir = false;
		} else {
			$this->configFile = (rtrim($this->classDir, '/') . '/' . 'eyy-indexer-config.php');

			if(is_file($this->configFile))
			{
				require_once($this->configFile);
			} else {
				$this->configFile = false;
			}
		}

		$this->previewsExtensions = $this->getPreviewExtensions();

		$requestedPath = ltrim($path, '/');

		if(is_file($requestedPath))
		{
			$dirName = dirname($requestedPath);

			$path = is_dir($dirName) ? $dirName : $path;
		}

    	$this->setPath($path);
	}

	function getPreviewExtensions()
	{
		if(defined('PREVIEW_EXSTENSIONS') && is_array(PREVIEW_EXSTENSIONS) && count(PREVIEW_EXSTENSIONS) > 0)
		{
			return array_map('strtolower', PREVIEW_EXSTENSIONS);
		} else {
			return array();
		}
	}

	function makePathClickable($path)
	{
		$split = explode('/', rtrim($path, '/'));

		$b = $op = '';

		foreach($split as $directory)
		{
			if(!empty($directory) && $directory !== '.')
			{
				$b .= '/' . $directory;

				if(empty($op))
				{
					$op .= sprintf('<a href="/">/</a><a href="%s">%s</a>', $b, $directory);
				} else {
					$op .= sprintf('/<a href="%s">%s</a>', $b, $directory);
				}
			} else {
				return '<a href="/">/</a>';
			}
		}

		return $op;
	}

	function getTitle($title = 'Indexer')
	{
    	if($this->currentPath == '' || $this->currentPath == '.')
    	{
    		return $title . ' // Index of /';
    	} else {
    		return $title . ' // Index of /' . $this->currentPathSafe;
    	}
	}

	function createUpper($timestamp = '')
	{
    	if(!empty($timestamp) && $timestamp > 0)
    	{
    		$timestamp = '[Newest: <span title="' . date('l, F jS Y H:i:s', $this->newest) . '">' . date('d/m/y H:i:s', $this->newest) . '</span>]';
    	} else {
    		$current_time = time();

    		$timestamp = '[Server Time: <span title="' . date('l, F jS Y H:i:s', $current_time) . '">' . date('d/m/y H:i:s', $current_time) . '</span>]';
    	}

    	$upper_urls = '';

    	if(defined('LINKS') && is_array(LINKS) && count(LINKS) > 0)
    	{
    		foreach(LINKS as $key => $value)
    		{
    			if(is_string($key) && is_string($value))
    			{
    				$upper_urls .= '<a href="' . $value . '">[' . $key . ']</a>';
    			}
    		}
    	}

    	if(empty($upper_urls)) { $upper_urls = '<a href="/">[Home]</a>'; }

    	return '<div class="upper-container">
        <span class="links">
          ' . $upper_urls . '
        </span>
        <div class="upper">' . $timestamp . PHP_EOL . '      </div>' . PHP_EOL . '
      </div>';
	}

	function setPath($path)
	{
		$path = trim(ltrim($path, '/'),  '/');

		$this->currentPath = $this->getCurrentPath($path);

		$this->currentPathReal = realpath($this->currentPath);

		$stack = debug_backtrace();

		$basePath = dirname($stack[count($stack) - 1]['file']);

		# Check if the requested path is above/equal to the scripts directory to avoid backwards directory traversal.

		if(substr($this->currentPathReal, 0, strlen($basePath)) !== $basePath)
		{
			$this->error = true;
		}

		# Check if current directory is disabled.

		if(defined('DISABLED_DIRECTORIES') && is_array(DISABLED_DIRECTORIES) && count(DISABLED_DIRECTORIES) > 0)
		{
			$this->currentDir = rtrim($path, '/');

			$this->currentDir = ($this->currentDir == '.' ? '/' : $this->currentDir);

			foreach(DISABLED_DIRECTORIES as $x)
			{
				$x = ($x == '.' ? '/' : $x);

				if(strlen($x) > 1)
				{
					$x = ltrim(rtrim($x, '/'), '/');
				}

				$this->currentDir = ($this->currentDir == '.' ? '/' : $this->currentDir);

				if($this->currentDir == $x)
				{
					$this->forbidden = true;
				}
			}
		}

		$this->currentPathSafe = htmlentities($path, ENT_QUOTES, 'UTF-8');

		return $this->currentPathSafe;
	}

	function getIndex($getPath = NULL)
	{
		if(!isset($this->currentPath))
		{
			if($getPath != NULL)
			{
				$this->setPath($getPath);
			} else {
				return $this->showError();
			}
		}

		if($this->forbidden === true)
		{
			return $this->showForbidden();
		}

		if($this->error === true)
		{
			return $this->showError();
		}

		$out = PHP_EOL . '      <div class="table-header">Index of <span>' . $this->makePathClickable($this->currentPathSafe) . '</span></div>';

		$out .= PHP_EOL . '      <table cellspacing="0" id="indexer-files-table">
		<tr>
		  <th class="sortable">Filename</th>
		  <th class="sortable">Modified</th>
		  <th class="sortable">Size</th>
		  <th>Options</th>
		</tr>' . PHP_EOL;

		$parentDir = dirname($this->currentPath);

		if($parentDir == '.') { $parentDir = ''; }

		if(!empty($this->currentPath))
		{
			$out .= sprintf('
        <tr><td class="parent"><a href="/%s">%s</a></td><td>-</td><td>-</td><td>-</td></tr>',
				htmlentities($parentDir, ENT_QUOTES, 'UTF-8'),
				'[Parent Directory]'
			) . PHP_EOL. PHP_EOL;
		}

		$__files = $__directories = array(); $hasFiles = false;

		if($this->currentPath != false)
		{
			$files = isset($this->currentPathReal) ? $this->getFiles($this->currentPathReal) :
			$this->getFiles(realpath($this->currentPath));

			if(is_array($files))
			{
				$ignored = array(
					'directories' => array(),
					'filenames' => array(),
					'extensions' => array()
				);

				if(defined('IGNORED_DIRECTORIES') && is_array(IGNORED_DIRECTORIES) &&
					count(IGNORED_DIRECTORIES) > 0)
				{
					$ignored['directories'] = array_map('strtolower', IGNORED_DIRECTORIES);
				}

				if(defined('IGNORED_FILENAMES') && is_array(IGNORED_FILENAMES) &&
					count(IGNORED_FILENAMES) > 0)
				{
					$ignored['filenames'] = array_map('strtolower', IGNORED_FILENAMES);
				}

				if(defined('IGNORED_EXSTENSIONS') && is_array(IGNORED_EXSTENSIONS) &&
					count(IGNORED_EXSTENSIONS) > 0)
				{
					$ignored['extensions'] = array_map('strtolower', IGNORED_EXSTENSIONS);
				}

				foreach($files as $file)
				{
					if(is_dir($this->currentPath . '/' . $file))
					{
						if(!in_array(strtolower($file), $ignored['directories']) && substr($file, 0, 1) != '.')
						{
							array_push($__directories, array('currentPath' => $this->currentPath, 'file' => $file));
						}
					} else {
						if(!in_array(strtolower($file), $ignored['filenames']) && substr($file, 0, 1) != '.')
						{
							if(!count($ignored['extensions']) > 0)
							{
								array_push($__files, array('currentPath' => $this->currentPath, 'file' => $file));
							} else {
								if(!in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), $ignored['extensions']))
								{
									array_push($__files, array('currentPath' => $this->currentPath, 'file' => $file));
								}
							}
						}
					}
				}
			}

			$totalSize = 0;

			foreach($__directories as $directory)
			{
				$data = $this->constructFileHtml($directory['currentPath'], $directory['file']);
				$out .= $data['html'];
			}

			foreach($__files as $file)
			{
				$data = $this->constructFileHtml($file['currentPath'], $file['file']);
				$out .= $data['html'];
				$totalSize = ($totalSize + $data['filesize']);

				$extension = pathinfo($file['file'], PATHINFO_EXTENSION);

				$hasFiles = true;
			}

		} else {
			return $this->showError();
		}

		$out .=  '     </table>
      <div class="bottom">';

		if($hasFiles === true && defined('SHOW_WGET') && SHOW_WGET === true)
		{
			$out .= '<span id="wget" class="no-select">[+wget]</span> - ';
		}

		$fileCountTotal = count($__files); $filesizeTotal = $this->readableFilesize($totalSize);
		$fileCountSpan = '<span id="file-count-bottom" data-total="' . $fileCountTotal . '">' . $fileCountTotal . '</span>';
		$totalSizeSpan = '<span id="filesize-bottom" data-total="' . $filesizeTotal . '">' . $filesizeTotal . '</span>';

		$out .= 'Showing ' . $fileCountSpan . ' files and ' . count($__directories) . ' directories' .
		($fileCountTotal > 0 ? (' - Total Size ' . $totalSizeSpan) : '');

		if(defined('SHOW_VERSION') && SHOW_VERSION === true)
		{
			$out .= ' - v' . self::VERSION;
		}

		$out .= ' ..';

        if($hasFiles === true && defined('SHOW_WGET') && SHOW_WGET === true)
        {
        	$out .= '
        <div class="command wget" data-path="' . $this->currentPathSafe . '">Javascript is required.</div>
        <div class="command-bottom"><div class="copy wget no-select">[Copy to clipboard]</div>
      </div>';
        }

		$out .= PHP_EOL . '
      </div>';

		return $this->createUpper($this->newest) . $out;
	}

	function constructFileHtml($path, $file)
	{
		$path = preg_replace('#/+#','/', $path);

		if($this->endsWith($path, '/') == false)
		{
			$path = ($path . '/');
		}

		$itemPath = ($path . $file); $isDir = is_dir($itemPath); $itemPreview = false;

		$itemExtension = strtolower(pathinfo($itemPath, PATHINFO_EXTENSION));

		if(!$isDir)
		{
			$itemPreview = in_array($itemExtension, $this->previewsExtensions) ? true : false;
		}

        $itemPath = ($path === './' ? ltrim($itemPath, './') : $itemPath);

		$fileInfo = $this->getFileInfo($itemPath, $file, $isDir, $itemExtension);

		$skeleton =
			'        <tr class="' . ($isDir ? 'item-dir' : 'item') . '">
		  <td data-raw="%s"' . ($itemPreview ? ' data-thumb="/' . $itemPath . '" class="preview"' : '') . '>%s</td>
		  <td data-raw="%s">%s</td>
		  <td data-raw="%s">%s</td>
		  <td' . ($isDir ? '' : ' class="download"') . '>%s</td>
		</tr>' . PHP_EOL . PHP_EOL;

		return array(
			'html' => sprintf(
			  $skeleton,
			  $fileInfo['rawData']['filenameFull'], $fileInfo['fileLink'],
			  $fileInfo['rawData']['fileModified'], $fileInfo['fileModified'],
			  $fileInfo['rawData']['filesizeRaw'], $fileInfo['filesize'],
			  $fileInfo['fileDirectDownload']
		), 'filesize' => $fileInfo['filesizeRaw']);
	}

	function shortenFilename($s, $cutoff = 30)
	{
		$halved = ($cutoff / 2) - 1;

		return mb_strlen($s) > $cutoff ? sprintf('%s .. %s', mb_substr($s, 0, $halved), mb_substr($s, ($halved) - ($halved * 2))) :
		$s;

	}

	function getFileInfo($filePath, $file, $isDir, $itemExtension)
	{
		$nameShortened = $this->shortenFilename($file, 30);

        $fileLink = $isDir ? sprintf(
        	'<span class="directory"><a href="/%s">[%s]</a></span>', $filePath, $nameShortened) :
            sprintf('<a href="/%s">%s</a>', $filePath, $nameShortened);

        $filesizeRaw = $isDir ? 0 : filesize($filePath);
        $directLink = $isDir ? '-' : '<a href="/' . ($filePath) . '" download filename="' . $file . '">[Download]</a>';

		return array(
			'filesize' => $isDir ? '-' : $this->readableFilesize($filesizeRaw),
			'filesizeRaw' => $filesizeRaw < 0 ? -1 : $filesizeRaw,
			'extension' => $itemExtension,
			'fileLink' => $fileLink,
			'fileModified' => $this->formatTimestamp(filemtime($filePath)),
			'fileDirectDownload' => $directLink,
			'rawData' => array(
        		'filenameFull' => $file,
        		'filesizeRaw' => $filesizeRaw < 0 ? -1 : $filesizeRaw,
        		'fileModified' => filemtime($filePath),
        	),
		);
	}

	function showForbidden()
	{
		return $this->createUpper() . '<h1 style="margin-top:15px; margin-bottom:10px; font-size: 12pt;">Forbidden</h1><span>This directory is not accessible.</span>';
	}

	function showError()
	{
		return $this->createUpper() . '<h1 style="margin-top:15px; margin-bottom:10px; font-size: 12pt;">Error</h1><span>This directory is either inaccessible or invalid.</span>';
	}

	function getCurrentPath($getDir)
	{
		if(strpos($getDir, '//') !== false) { return false; }

		if(empty($getDir) || isset($getDir) == false) { return '.'; }

		return file_exists($getDir) ? $getDir : false;
	}

	function getFiles($dir)
	{
		return file_exists($dir) ? scandir($dir) : false;
	}

	function startsWith($haystack, $needle) {
		return $needle === '' || strrpos($haystack, $needle, - strlen($haystack)) !== false;
	}

	function endsWith($haystack, $needle)
	{
		$length = strlen($needle);

		return $length === 0 || (substr($haystack, - $length) === $needle);
	}

	function formatTimestamp($timestamp)
	{
		if($timestamp > $this->newest) { $this->newest = $timestamp; }

		return date('d/m/y H:i', $timestamp);
	}

	function readableFilesize($bytes, $decimals = 2)
	{
		if($bytes == -1) { return '> 2 GB'; }

		if($bytes > 104857600) { $decimals = 0; }

		$size = array(' B',' kB',' MB',' GB',' TB',' PB',' EB',' ZB',' YB');

		$factor = floor((strlen($bytes) - 1) / 3);

		$x = @$size[$factor];

		if($x == ' kB') { $decimals = 0; }

		return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . $x;
	}

}
?>
