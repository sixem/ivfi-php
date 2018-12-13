<?php

class indexer
{
	CONST VERSION = "1.0.0";

	protected $PREVIEW_EXSTS = array(
		'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'
	);

	protected $IGNORED_DIRS = array();

	protected $IGNORED_FILES = array(
		'index.php', 'indexer.php'
	);

	protected $IGNORED_EXTS = array();

	protected $DISABLED_DIRS = array();

	protected $SHOW_VERSION = false;

	protected $SHOW_WGET = true;

	protected $CUSTOM_ERROR_PAGE = '';

	function __construct($a = array(), $path = NULL)
	{
    		$this->setOptions($a);

    		$this->newest = 0;

    		$this->filetypes = array();

    		$this->error = $this->forbidden = false;

    		$this->current_path_safe = '';

    		if($path != NULL) { $this->setPath($path); } else { $this->setPath(''); }
	}

	function setOptions($options)
	{
    		foreach(array_keys($options) as $key)
    		{
    			$validOptions = array(
    				'PREVIEW_EXSTS',
    				'IGNORED_DIRS',
    				'IGNORED_FILES',
    				'IGNORED_EXTS',
    				'DISABLED_DIRS',
    				'SHOW_VERSION',
    				'SHOW_WGET',
    				'CUSTOM_ERROR_PAGE'
    			);

    			foreach($validOptions as $e)
    			{
    				if(strtoupper($key) == $e)
    				{
    					if(gettype($this->{$e}) == gettype($options[$key]))
    					{
    						$this->{$e} = $options[$key];
    					} else {
    						$this->alertInvalidSetting($e, $this->{$e});
    					}
    				}
    			}
    		}

    		if(!empty($this->IGNORED_DIRS))
    		{
    			$this->IGNORED_DIRS = array_map('strtolower', $this->IGNORED_DIRS);
    		}

    		if(!empty($this->IGNORED_FILES))
    		{
    			$this->IGNORED_FILES = array_map('strtolower', $this->IGNORED_FILES);
    		}
	}

	function makePathClickable($path)
	{
		$path = rtrim($path, '/');

		$split = explode('/', $path);

		$b = $op = (string) NULL;

		foreach($split as $directory)
		{
			if(!empty($directory))
			{
				$b .= '/' . $directory;

				if(empty($op))
				{
					$op .= sprintf('<a href="/">/</a><a href="%s">%s</a>', $b, $directory);
				} else {
					$op .= sprintf('/<a href="%s">%s</a>', $b, $directory);
				}
			}
		}

		return $op;
	}

	function createTitle()
	{
    		if($this->current_path == '' || $this->current_path == '.')
    		{
    			return 'Indexer // Viewing /';
    		} else {
    			return 'Indexer // Viewing /' . $this->current_path_safe;
    		}
	}

	function createUpper($timestamp = '')
	{
    		if(!empty($timestamp))
    		{
    			if($timestamp > 0)
    			{
    				$timestamp = '[Newest: <span title="' . date('l, F jS Y H:i:s', $this->newest) . '">' . date('d/m/y H:i:s', $this->newest) . '</span>]';
    			}
    		} else {
    			$current_time = time();

    			$timestamp = '[Server Time: <span title="' . date('l, F jS Y H:i:s', $current_time) . '">' . date('d/m/y H:i:s', $current_time) . '</span>]';
    		}

    		return '<div class="upper-container">
        <span class="links">
          <a href="/">[Home]</a>
        </span>
        <div class="upper">' . $timestamp . PHP_EOL . '      </div>' . PHP_EOL . '
      </div>';
	}

	function setPath($path)
	{
		$this->current_path = $this->getCurrentPath($path);

		$stack = debug_backtrace();

		$basePath = dirname($stack[count($stack) - 1]['file']);

		# Check if the requested path is above/equal to the scripts directory to avoid backwards directory traversal.

		if(substr(realpath($this->current_path), 0, strlen($basePath)) !== $basePath)
		{
			$this->error = true;
		}

		# Check if current directory is disabled.

		if(count($this->DISABLED_DIRS) > 0)
		{
			$this->currentDir = rtrim($path, '/');

			foreach($this->DISABLED_DIRS as $x)
			{
				if($this->currentDir == ltrim(rtrim($x, '/'), '/'))
				{
					$this->forbidden = true;
				}
			}
		}

		$this->current_path_safe = $this->makeSafe($path);

		return $this->current_path_safe;
	}

	function getIndex($get_path = NULL)
	{
		if(!isset($this->current_path))
		{
			if($get_path != NULL)
			{
				$this->setPath($get_path);
			} else {
				return $this->showError();
			}
		}

		if($this->forbidden == true)
		{
			return $this->showForbidden();
		}

		if($this->error == true)
		{
			return $this->showError();
		}

		$out = PHP_EOL . '      <div class="table-header">Index of <span>' . $this->makePathClickable($this->current_path_safe) . '</span></div>';

		$out .= PHP_EOL . '      <table cellspacing="0" id="indexer-files-table">
		<tr>
		  <th class="sortable">Filename</th>
		  <th class="sortable">Modified</th>
		  <th class="sortable">Size</th>
		  <th>Options</th>
		</tr>' . PHP_EOL;

		$parentDir = dirname($this->current_path);

		if($parentDir == '.') { $parentDir = ''; }

		if(!empty($this->current_path))
		{
			$out .= sprintf("
        <tr><td class=\"parent\"><a href=\"/%s\">%s</a></td><td>-</td><td>-</td><td>-</td></tr>",
				$this->makeSafe($parentDir),
				'[Parent Directory]'
			) . PHP_EOL. PHP_EOL;
		}

		$filesArr = $dirsArr = array();

		if($this->current_path != false)
		{
			$files = $this->getFiles(realpath($this->current_path));

			if(is_array($files))
			{
				foreach($files as $file)
				{
					if(is_dir($this->current_path . '/' . $file))
					{
						if(!in_array(strtolower($file), $this->IGNORED_DIRS) && substr($file, 0, 1) != '.')
						{
							array_push($dirsArr, array('currentPath' => $this->current_path, 'file' => $file));
						}
					} else {
						if(!in_array(strtolower($file), $this->IGNORED_FILES) && substr($file, 0, 1) != '.')
						{
							array_push($filesArr, array('currentPath' => $this->current_path, 'file' => $file));
						}
					}
				}
			}

			$totalSize = 0;

			foreach($dirsArr as $entry)
			{
				$data = $this->constructFileHtml($entry['currentPath'], $entry['file']);
				$out .= $data['html'];
			}
			foreach($filesArr as $entry)
			{
				$data = $this->constructFileHtml($entry['currentPath'], $entry['file']);
				$out .= $data['html'];
				$totalSize = ($totalSize + $data['filesize']);

				$extension = pathinfo($entry['file'], PATHINFO_EXTENSION);

				if(!in_array($extension, $this->filetypes))
				{
					array_push($this->filetypes, $extension);
				}
			}

		} else {
			return $this->showError();
		}

		$out .=  '     </table>
      <div class="bottom">';

		if(count($this->filetypes) > 0 && $this->SHOW_WGET == true)
		{
			$out .= '<span id="wget" class="no-select">[+wget]</span> - ';
		}

		if(count($filesArr) > 0)
		{
			$out .= 'Showing ' . count($filesArr) . ' files and ' . count($dirsArr) . ' directories - Total Size ' . $this->readableFilesize($totalSize);
		} else {
			$out .= 'Showing ' . count($filesArr) . ' files and ' . count($dirsArr) . ' directories';
		}

		if($this->SHOW_VERSION == true) { $out .= ' - v. ' . self::VERSION; }

		$out .= ' ..';

        if(count($this->filetypes) > 0 && $this->SHOW_WGET === true)
        {
        	$out .= '
          <div class="command wget" data-path="' . $this->current_path_safe . '">Javascript is required.</div>';
        	$out .= '
          <div class="command-bottom"><div class="copy wget no-select">[Copy to clipboard]</div>
      </div>';
        }

		$out .= PHP_EOL . '
      </div>';

		return $this->createUpper($this->newest) . $out;
	}

	function makeSafe($s)
	{
		return htmlentities($s, ENT_QUOTES, 'utf-8');
	}

	function constructFileHtml($path, $file)
	{
		$path = preg_replace('#/+#','/', $path);

		if($this->endsWith($path, '/') == false) { $path = ($path . '/'); }

		$file_info = $this->getFileInfo($path, $file);

		if(is_dir($path . $file))
		{
			$item_class = 'item-dir';
		} else {
			$item_class = 'item';

			if(in_array($file_info["extension"], array('7z', 'zip', 'rar', 'tar', 'tar.gz', 'tgz', 'tar.bz2')))
			{
				$item_class = 'item file-archive';
			}
		}

		if(in_array($file_info["extension"], $this->PREVIEW_EXSTS))
		{
			$skeleton =
			'        <tr class="' . $item_class . '">
		  <td data-raw="%s" data-thumb="/' . ($path . $file) . '" class="preview">%s</td>
		  <td data-raw="%s">%s</td>
		  <td data-raw="%s">%s</td>
		  <td class="download">%s</td>
		</tr>' . PHP_EOL . PHP_EOL;
		} else {
			$skeleton =
			'        <tr class="' . $item_class . '">
		  <td data-raw="%s">%s</td>
		  <td data-raw="%s">%s</td>
		  <td data-raw="%s">%s</td>
		  <td>%s</td>
		</tr>' . PHP_EOL . PHP_EOL;
		}

		return array(
			"html" => sprintf(
			  $skeleton,
			  $file_info["raw_data"]["filename_full"], $file_info["file_link"],
			  $file_info["raw_data"]["file_modified"], $file_info["file_modified"],
			  $file_info["raw_data"]["filesize_raw"], $file_info["filesize"],
			  $file_info["file_direct_download"]
		), "filesize" => $file_info["filesize_raw"]);
	}

	function shortenFilename($s, $cutoff = 30)
	{
		$halved = ($cutoff / 2) - 1;

		if(mb_strlen($s) > $cutoff) {
			return sprintf("%s .. %s", mb_substr($s, 0, $halved), mb_substr($s, ($halved) - ($halved * 2)));
		} else {
			return $s;
		}

	}

	function getFileInfo($path, $file)
	{
		$name_shortened = $this->shortenFilename($file, 30);

		if(is_dir($path . $file))
		{
			$fileSize = "-";
			$filesize_raw = 0;
			$file_link = sprintf("<span class=\"directory\"><a href=\"/%s\">[%s]</a></span>",
				$path . $file,
				$name_shortened);
			$direct_link = '-';
		} else {
			$filesize_raw = filesize($path . $file);

			if($filesize_raw < 0) { $filesize_raw = -1; }

			$fileSize = $this->readableFilesize($filesize_raw);
			$file_link = sprintf("<a href=\"/%s\">%s</a>", $path . $file, $name_shortened);
			$direct_link = '<a href="/' . ($path . $file) . '" download filename="' . $file . '">[Download]</a>';
		}

        $raw_data = array(
        	'filename_full' => $file,
        	'filesize_raw' => $filesize_raw,
        	'file_modified' => filemtime($path . $file),
        );

		return array(
			'filesize' => $fileSize,
			'filesize_raw' => $filesize_raw,
			'extension' => strtolower(pathinfo($path . $file, PATHINFO_EXTENSION)),
			'file_link' => $file_link,
			'file_modified' => $this->formatTimestamp(filemtime($path . $file)),
			'file_direct_download' => $direct_link,
			'raw_data' => $raw_data,
		);
	}

	function showForbidden()
	{
		return $this->createUpper() . '<h1 style="margin-top:15px; margin-bottom:10px; font-size: 12pt;">Forbidden</h1><span>This directory is not accessible.</span>';
	}

	function showError()
	{
		if(!empty($this->CUSTOM_ERROR_PAGE))
		{
			if(is_file($this->CUSTOM_ERROR_PAGE))
			{
				include($this->CUSTOM_ERROR_PAGE); die();
			} else {
				return $this->createUpper() . '<h1 style="margin-top:15px; margin-bottom:10px; font-size: 12pt;">Error</h1><span>This directory is either inaccessible or invalid.</span>';
			}
		} else {
			return $this->createUpper() . '<h1 style="margin-top:15px; margin-bottom:10px; font-size: 12pt;">Error</h1><span>This directory is either inaccessible or invalid.</span>';
		}
	}

	function alertInvalidSetting($x, $y)
	{
		echo sprintf(
			"<p style=\"font-size:12px;\"><span style=\"font-weight:bold;\">ALERT</span>: Invalid setting detected! '%s' is type '%s' but it should be type '%s'.</p>",
			$x, gettype($x), gettype($y)
		);
	}

	function getCurrentPath($getDir)
	{

		if(strpos($getDir, '//') !== false) { return false; }

		if(empty($getDir) || isset($getDir) == false)
		{
			return '.';
		} else {
			if(file_exists($getDir))
			{
				return $getDir;
			} else {
				return false;
			}
		}
	}

	function getFiles($dir)
	{
		if(file_exists($dir)) { return scandir($dir); } else { return false; }
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
