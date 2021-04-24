<?php

/**
 * <eyy-indexer> [https://github.com/sixem/eyy-indexer]
 *
 * @license  https://github.com/sixem/eyy-indexer/blob/master/LICENSE GPL-3.0
 * @author   emy <admin@eyy.co>
 * @version  dev-1.1.8
 */

/**
 * [Configuration]
 * A more in-depth overview can be found here:
 * https://github.com/sixem/eyy-indexer/blob/master/CONFIG.md
 */

/* Used to bust the cache and to display footer version number. */
$version = 'dev-1.1.8';

$config = array(
    /* Authentication options. */
    'authentication' => false,
    /* Formatting options. */
    'format' => array(
        'title' => 'Index of %s', /* title format where %s is the current path. */
        'date' => array('d/m/y H:i', 'd/m/y'), /* date formats (desktop, mobile). */
        'sizes' => array(' B', ' kB', ' MB', ' GB', ' TB') /* size formats. */
    ),
    /* Favicon options. */
    'icon' => array(
        'path' => '/favicon.ico', /* what favicon to use. */
        'mime' => 'image/x-icon' /* favicon mime type. */
    ),
    /* Sorting options. Used as default until the client sets their own sorting settings. */
    'sorting' => array(
        'enabled' => false, /* whether the server should sort the items. */
        'order' => SORT_ASC, /* sorting order. asc or desc. */
        'types' => 0, /* what item types to sort. 0 = both. 1 = files only. 2 = directories only. */
        'sort_by' => 'name', /* what to sort by. available options are name, modified, type and size. */
        'use_mbstring' => false /* enabled mbstring when sorting. */
    ),
    /* Gallery options. */
    'gallery' => array(
        'enabled' => true, /* whether the gallery plugin should be enabled. */
        'fade' => 0, /* fade in ms when navigating */
        'reverse_options' => false, /* reverse search options for images (when hovering over them). */
        'scroll_interval' => 50, /* break in ms between scroll navigation events. */
        'list_alignment' => 0, /* list alignment where 0 is right and 1 is left. */
        'fit_content' => true /* whether the media should be forced to fill the screen space. */
    ),
    /* Preview options. */
    'preview' => array(
        'enabled' => true, /* whether the preview plugin should be enabled. */
        'hover_delay' => 75, /* delay in ms before the preview is shown. */
        'cursor_indicator' => true /* displays a loading cursor while the preview is loading. */
    ),
    /* Extension that should be marked as media.
     * These extensions will have potential previews and will be included in the gallery. */
    'extensions' => array(
        'image' => array('jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'bmp', 'webp'),
        'video' => array('webm', 'mp4', 'ogg', 'ogv')
    ),
    /* Styling options. */
    'style' => array(
        /* Set to a path relative to the root directory (location of this file) containg .css files.
         * Each .css file will be treated as a separate theme. Set to false to disable themes. */
        'themes' => array(
          'path' => false,
          'default' => false
        ),
        /* Enables a more compact styling of the page. */
        'compact' => false
    ),
    /* Filter what files or directories to show.
     * Uses regular expressions. All names !matching! the regex will be shown.
     * Setting the value to false will disable the respective filter. */
    'filter' => array(
        'file' => false,
        'directory' => false
    ),
    /* Calculates the size of directories.
     * This can be intensive, especially with the recursive option, so be aware of that. */
    'directory_sizes' => array(
      /* Whether directory sizes should be calculated or not. */
      'enabled' => false,
      /* Whether directories should be scanned recursively or not when calculating size. */
      'recursive' => false
    ),
    /* Whether this .php file should be directly accessible. */
    'allow_direct_access' => false,
    /* Set to 'strict' or 'weak'.
     * 'strict' uses realpath() to avoid backwards directory traversal whereas 'weak' uses a similar string-based approach. */
    'path_checking' => 'strict',
    /* Whether extra information in the footer should be generated (page load time, path etc.). */
    'footer' => true,
    /* Displays a simple link to the git repository in the footer along with the current version.
     * I would really appreciate it if you keep this enabled. */
    'credits' => true,
    /* Enables console output in JS and PHP debugging. */
    'debug' => true
);

/* Look for a config file in the current directory. */
$config_file = (basename(__FILE__, '.php') . '.config.php');

/* If found, it'll override the above configuration values.
 * Any unset values in the file will take the default values. */
if(file_exists($config_file))
{
  $config = include($config_file);
} else if(file_exists('.' . $config_file)) /* Also check for hidden (.) file. */
{
  $config = include('.' . $config_file);
}

/* Default configuration values. Used if values from the above config are unset. */
$defaults = array('authentication' => false,'format' => array('title' => 'Index of %s','date' => array('m/d/y H:i:s', 'd/m/y'),'sizes' => array(' B', ' kB', ' MB', ' GB', ' TB')),'icon' => array('path' => '/favicon.png','mime' => 'image/png'),'sorting' => array('enabled' => false,'order' => SORT_ASC,'types' => 0,'sort_by' => 'name','use_mbstring' => false),'gallery' => array('enabled' => true,'fade' => 0,'reverse_options' => false,'scroll_interval' => 50,'list_alignment' => 0,'fit_content' => true),'preview' => array('enabled' => true,'hover_delay' => 75,'cursor_indicator' => true),'extensions' => array('image' => array('jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'bmp', 'webp'),'video' => array('webm', 'mp4', 'ogg', 'ogv')),'style' => array('themes' => array('path' => false,'default' => false),'compact' => false),'filter' => array('file' => false,'directory' => false),'directory_sizes' => array('enabled' => false, 'recursive' => false),'allow_direct_access' => false,'path_checking' => 'strict','footer' => true,'credits' => true,'debug' => false);

function authenticate($users, $realm)
{
  function http_digest_parse($text)
  {
    /* Protect against missing data. */
    $needed_parts = array(
      'nonce' => 1,
      'nc' => 1,
      'cnonce' => 1,
      'qop' => 1,
      'username' => 1,
      'uri' => 1,
      'response' => 1
    );

    $data = array();
    $keys = implode('|', array_keys($needed_parts));

    preg_match_all('@(' . $keys . ')=(?:([\'"])([^\2]+?)\2|([^\s,]+))@', $text, $matches, PREG_SET_ORDER);

    foreach($matches as $m)
    {
      $data[$m[1]] = $m[3] ? $m[3] : $m[4];
      unset($needed_parts[$m[1]]);
    }

    return $needed_parts ? false : $data;
  }

  function createHeader($realm)
  {
    header($_SERVER['SERVER_PROTOCOL'] . '401 Unauthorized');
    header('WWW-Authenticate: Digest realm="' . $realm . '",qop="auth",nonce="' . uniqid() . '",opaque="' . md5($realm) . '"');
  }

  if(empty($_SERVER['PHP_AUTH_DIGEST']))
  {
    createHeader($realm);
    die('401 Unauthorized');
  }

  $data = http_digest_parse($_SERVER['PHP_AUTH_DIGEST']);

  if(!$data || !isset($users[$data['username']]))
  {
    createHeader($realm);
    die('Invalid credentials.');
  }

  $a1 = md5($data['username'] . ':' . $realm . ':' . $users[$data['username']]);
  $a2 = md5($_SERVER['REQUEST_METHOD'] . ':' . $data['uri']);

  $valid_response = md5($a1 . ':' . $data['nonce'] . ':' . $data['nc'] . ':' . $data['cnonce'] . ':' . $data['qop'] . ':' . $a2);

  if($data['response'] != $valid_response)
  {
    createHeader($realm);
    die('Invalid credentials.');
  }
}


if($config['authentication'] && is_array($config['authentication']) && count($config['authentication']) > 0)
{
  authenticate($config['authentication'], 'Restricted content.');
}

/* Set default configuration values if the config is missing any keys.
 * This does not go too deep at all. */
foreach($defaults as $key => $value)
{
  if(!isset($config[$key]))
  {
    $config[$key] = $defaults[$key];
  } else if(is_array($config[$key]))
  {
    foreach($defaults[$key] as $k => $v)
    {
      if(!isset($config[$key][$k]))
      {
        $config[$key][$k] = $defaults[$key][$k];
      }
    }
  }
}

if($config['footer'] === true)
{
  $render = microtime(true);
}

if($config['debug'] === true)
{
  ini_set('display_errors', 1);
  ini_set('display_startup_errors', 1);

  error_reporting(E_ALL);
}

if($config['style']['themes']['path'])
{
  if($config['style']['themes']['path'][0] !== '/')
  {
    $config['style']['themes']['path'] = ('/' . $config['style']['themes']['path']);
  }

  if(substr($config['style']['themes']['path'], -1) !== '/')
  {
    $config['style']['themes']['path'] = ($config['style']['themes']['path'] . '/');
  }
}

if(!is_array($config['format']['date']))
{
  if(is_string($config['format']['date']))
  {
    $config['format']['date'] = array($config['format']['date']);
  } else {
    $config['format']['date'] = array('d/m/y H:i', 'd/m/y');
  }
}

class Indexer
{
  public $path;
  private $relative, $requested, $types, $allow_direct;

  function __construct($path, $options = array())
  {
    $requested = rawurldecode(strpos($path, '?') !== false ? explode('?', $path)[0] : $path);

    if(isset($options['path']['relative']) && $options['path']['relative'] !== NULL)
    {
      $this->relative = $options['path']['relative'];
    } else {
      $this->relative = dirname(__FILE__);
    }

    $this->client = isset($options['client']) ? $options['client'] : NULL;
    $this->allow_direct = isset($options['allow_direct_access']) ? $options['allow_direct_access'] : true;
    $this->path = rtrim(self::joinPaths($this->relative, $requested), '/');
    $this->timestamp = time();
    $this->directory_sizes = $options['directory_sizes'];

    if(is_dir($this->path))
    {
      if(self::isAboveCurrent($this->path, $this->relative))
      {
        $this->requested = $requested;
      } else {
        if($options['path_checking'] === 'strict' || $options['path_checking'] !== 'weak')
        {
          throw new Exception("requested path (is_dir) is below the public working directory. (mode: {$options['path_checking']})", 1);
        } else if($options['path_checking'] === 'weak')
        {
          if(self::isAboveCurrent($this->path, $this->relative, false) || is_link($this->path))
          {
            $this->requested = $requested;
          } else {
            throw new Exception("requested path (is_dir) is below the public working directory. (mode: {$options['path_checking']})", 2);
          }
        }
      }
    } else {
      if(is_file($this->path))
      {
        if($this->allow_direct === false)
        {
          http_response_code(403); die('Forbidden');
        } else {
          $this->path = dirname($this->path);

          if(self::isAboveCurrent($this->path, $this->relative))
          {
            $this->requested = dirname($requested);
          } else {
            throw new Exception('requested path (is_file) is below the public working directory.', 3);
          }
        }
      } else {
        throw new Exception('invalid path. path does not exist.', 4);
      }
    }

    if(isset($options['extensions']))
    {
        $this->types = array();

        foreach($options['extensions'] as $type => $value)
        {
          foreach($options['extensions'][$type] as $extension) $this->types[strtolower($extension)] = $type;
        }
    } else {
        $this->types = array(
          'jpg' => 'image',
          'jpeg' => 'image',
          'gif' => 'image',
          'png' => 'image',
          'ico' => 'image',
          'svg' => 'image',
          'bmp' => 'image',
          'webm' => 'video',
          'mp4' => 'video'
        );
    }

    if(isset($options['filter']) && is_array($options['filter']))
    {
      $this->filter = $options['filter'];
    } else {
      $this->filter = array(
        'file' => false,
        'directory' =>  false
      );
    }

    if(isset($options['format']['sizes']) && $options['format']['sizes'] !== NULL)
    {
      $this->format['sizes'] = $options['format']['sizes'];
    } else {
      $this->format['sizes'] = array(' B', ' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB');
    }

    $this->format['date'] = $options['format']['date'];
  }

  public function buildTable($sorting = false, $sort_items = 0, $sort_type = 'modified', $use_mb = false)
  {
    $cookies = array(
      'timezone_offset' => intval(is_array($this->client) ? (isset($this->client['timezone_offset']) ? $this->client['timezone_offset'] : 0) : 0)
    );

    $script_name = basename(__FILE__);
    $directory = self::getCurrentDirectory();
    $files = self::getFiles();
    $is_base = ($directory === '/');

    $op = sprintf(
      '<tr class="parent"><td><a href="%s">[Parent Directory]</a></td><td>-</td><td>-</td><td>-</td></tr>',
      dirname($directory)
    );

    $timezone = array(
      'offset' => $cookies['timezone_offset'] > 0 ? -$cookies['timezone_offset'] * 60 : abs($cookies['timezone_offset']) * 60
    );

    $data = array(
      'files' => array(),
      'directories' => array(),
      'recent' => array(
        'file' => 0,
        'directory' => 0
      ),
      'size' => array(
        'total' => 0,
        'readable' => 'N/A'
      )
    );

    foreach($files as $file)
    {
      if($file[0] === '.') continue;

      $path = ($this->path . '/' . $file);

      if(is_dir($path))
      {
        if($is_base && $file === 'indexer')
        {
          continue;
        } else if($this->filter['directory'] !== false && !preg_match($this->filter['directory'], $file))
        {
          continue;
        }

        array_push($data['directories'], array($path, $file)); continue;
      } else if(file_exists($path))
      {
        if($is_base && $file === $script_name)
        {
          continue;
        } else if($this->filter['file'] !== false && !preg_match($this->filter['file'], $file))
        {
          continue;
        }

        array_push($data['files'], array($path, $file)); continue;
      }
    }

    if($use_mb === true && !function_exists('mb_strtolower'))
    {
      http_response_code(500);

      die(
        'Error (mb_strtolower is not defined): In order to use mbstring, you\'ll need to ' .
        '<a href="https://www.php.net/manual/en/mbstring.installation.php">install</a> ' .
        'it first.'
      );
    }

    foreach($data['directories'] as $index => $dir)
    {
      $item = &$data['directories'][$index];

      $item['name'] = $use_mb === true ? mb_strtolower($dir[1], 'UTF-8') : strtolower($dir[1]);
      $item['modified'] = self::getModified($dir[0], $timezone['offset']);
      $item['type'] = 'directory';
      $item['size'] = $this->directory_sizes['enabled'] ? ($this->directory_sizes['recursive'] ? self::getDirectorySizeRecursively($dir[0]) : self::getDirectorySize($dir[0])) : 0;
    }

    foreach($data['files'] as $index => $file)
    {
      $item = &$data['files'][$index];

      $item['name'] = $use_mb === true ? mb_strtolower($file[1], 'UTF-8') : strtolower($file[1]);
      $item['type'] = self::getFileType($file[1]);
      $item['size'] = self::getSize($file[0]);
      $item['modified'] = self::getModified($file[0], $timezone['offset']);
      $item['path'] = rtrim(self::joinPaths($this->requested, $file[1]), '/');
    }

    if($sorting)
    {
      if($sort_items === 0 || $sort_items === 1)
      {
        array_multisort(
          array_column($data['files'], $sort_type),
          $sorting,
          $data['files']
        );
      }

      if($sort_items === 0 || $sort_items === 2)
      {
        array_multisort(
          array_column($data['directories'], $sort_type),
          $sorting,
          $data['directories']
        );
      }
    }

    foreach($data['directories'] as $dir)
    {
      if($this->directory_sizes['enabled'])
      {
        $data['size']['total'] = ($data['size']['total'] + $dir['size']);
      }

      $op .= sprintf(
        '<tr class="directory"><td data-raw="%s"><a href="%s">[%s]</a></td><td data-raw="%s"><span>%s</span></td>',
        $dir[1], rtrim(self::joinPaths($this->requested, $dir[1]), '/'), $dir[1], $dir['modified'][0], $dir['modified'][1]
      );

      if($data['recent']['directory'] === 0 || $dir['modified'][0] > $data['recent']['directory'])
      {
        $data['recent']['directory'] = $dir['modified'][0];
      }

      $op .= sprintf(
        '<td%s>%s</td>',
        $this->directory_sizes['enabled'] ? ' data-raw="' . $dir['size'] . '"' : '',
        $this->directory_sizes['enabled'] ? self::readableFilesize($dir['size']) : '-'
      );

      $op .= '<td>-</td></tr>';
    }

    foreach($data['files'] as $file)
    {
      $data['size']['total'] = ($data['size']['total'] + $file['size'][0]);

      if($data['recent']['file'] === 0 || $file['modified'][0] > $data['recent']['file'])
      {
        $data['recent']['file'] = $file['modified'][0];
      }

      $op .= sprintf(
        '<tr class="file"><td data-raw="%s">',
        $file[1]
      );

      $op .= sprintf(
        '<a%shref="%s">%s</a></td>',
        (($file['type'][0] === 'image' || $file['type'][0] === 'video' ? true : false) ? ' class="preview" ' : ' '), $file['path'], $file[1]
      );

      $op .= sprintf(
        '<td data-raw="%d"><span>%s</span></td>',
        $file['modified'][0], $file['modified'][1]
      );

      $op .= sprintf(
        '<td data-raw="%d">%s</td>',
        $file['size'][0] === -1 ? 0 : $file['size'][0], $file['size'][1]
      );

      $op .= sprintf(
        '<td data-raw="%s" class="download"><a href="%s" download="" filename="%s">%s</a></td></tr>',
        $file['type'][0], $file['path'], $file[1], ('<span data-view="mobile">[Save]</span><span data-view="desktop">[Download]</span>')
      );
    }

    $data['size']['readable'] = self::readableFilesize($data['size']['total']);

    $this->data = $data;

    return $op;
  }

  private function getFiles()
  {
    return scandir($this->path, SCANDIR_SORT_NONE);
  }

  private function removeDotSegments($input)
  {
    $output = '';

    while($input !== '')
    {
      if(($prefix = substr($input, 0, 3)) == '../' || ($prefix = substr($input, 0, 2)) == './')
      {
        $input = substr($input, strlen($prefix));
      } else if(($prefix = substr($input, 0, 3)) == '/./' || ($prefix = $input) == '/.')
      {
        $input = '/' . substr($input, strlen($prefix));
      } else if (($prefix = substr($input, 0, 4)) == '/../' || ($prefix = $input) == '/..')
      {
        $input = '/' . substr($input, strlen($prefix));
        $output = substr($output, 0, strrpos($output, '/'));
      } else if($input == '.' || $input == '..')
      {
        $input = '';
      } else
      {
        $pos = strpos($input, '/');
        if($pos === 0) $pos = strpos($input, '/', $pos+1);
        if($pos === false) $pos = strlen($input);
        $output .= substr($input, 0, $pos);
        $input = (string) substr($input, $pos);
      }
    }

    return $output;
  }

  private function isAboveCurrent($path, $base, $use_realpath = true)
  {
    return self::startsWith($use_realpath ? realpath($path) : self::removeDotSegments($path), $use_realpath ? realpath($base) : self::removeDotSegments($base));
  }

  public function getLastData()
  {
    return isset($this->data) ? $this->data : false;
  }

  public function getCurrentDirectory()
  {
    $requested = trim($this->requested);

    if($requested === '/' || $requested === '\\' || empty($requested))
    {
      return '/';
    } else {
      return $requested[strlen($requested) - 1] === '/' ? rtrim($requested, '/') . '/' : rtrim($requested, '/');
    }
  }

  private function getFileType($filename)
  {
    $extension = strtolower(ltrim(pathinfo($filename, PATHINFO_EXTENSION), '.'));

    return array(isset($this->types[$extension]) ? $this->types[$extension] : 'other', $extension);
  }

  public function makePathClickable($path)
  {
    $paths = explode('/', ltrim($path, '/'));

    $op = ('<a href="/">/</a>');

    foreach($paths as $i => $p)
    {
      $i++;

      $op .= sprintf(
        '<a href="/%s">%s</a>',
        implode('/', array_slice($paths, 0, $i)), (($i !== 1 ? '/' : '') . $p)
      );
    }

    return $op;
  }

  private function formatDate($format, $stamp, $modifier = 0)
  {
    return gmdate($format, $stamp + $modifier);
  }

  private function getModified($path, $modifier = 0)
  {
    $stamp = filemtime($path);

    if(count($this->format['date']) > 1)
    {
      $format = sprintf('<\s\p\a\n \d\a\t\a-\v\i\e\w="\d\e\s\k\t\o\p">%s\<\/\s\p\a\n\>'.
      '<\s\p\a\n \d\a\t\a-\v\i\e\w="\m\o\b\i\l\e">%s\<\/\s\p\a\n\>',
      $this->format['date'][0], $this->format['date'][1]);
    } else {
      $format = $this->format['date'][0];
    }

    return array(
      $stamp,
      self::formatDate($format, $stamp, $modifier)
    );
  }

  private function getCookie($key, $default = NULL)
  {
    return isset($_COOKIE[$key]) ? $_COOKIE[$key] : $default;
  }

  private function getSize($path)
  {
    $fs = filesize($path);
    $size = ($fs < 0 ? -1 : $fs);

    return array($size, self::readableFilesize($size));
  }

  private function getDirectorySize($path)
  {
    $size = 0;

    foreach(scandir($path, SCANDIR_SORT_NONE) as $file)
    {
      if($file[0] === '.')
      {
        continue;
      } else {
        $filesize = filesize(self::joinPaths($path, $file));

        if($filesize && $filesize > 0)
        {
          $size += $filesize;
        }
      }
    }

    return $size;
  }

  private function getDirectorySizeRecursively($path)
  {
    $size = 0;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path));

    foreach($iterator as $file)
    {
      if($file->isDir())
      {
        continue;
      } else {
        $size += filesize($file->getPathname());
      }
    }

    return $size;
  }

  private function readableFilesize($bytes, $decimals = 2)
  {
    if($bytes === -1) return '-';

    $factor = floor((strlen($bytes) - 1) / 3);

    $x = @$this->format['sizes'][$factor];

    if($bytes > 104857600 || $factor == 0)
    {
      $decimals = 0;
    }

    if($x === $this->format['sizes'][1]) $decimals = 0;

    return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . $x;
  }

  private function startsWith($haystack, $needle)
  {
    return $needle === '' || strrpos($haystack, $needle, - strlen($haystack)) !== false;
  }

  public function joinPaths(...$params)
  {
    $paths = array();

    foreach($params as $param)
    {
      if($param !== '') $paths[] = $param;
    }

    return preg_replace('#/+#','/', join('/', $paths));
  }
}

$client =  isset($_COOKIE['ei-client']) ? $_COOKIE['ei-client'] : NULL;

if($client)
{
  $client = json_decode($client, true);
}

$validate = is_array($client);

$cookies = array(
  'sorting' => array(
    'row' => $validate ? (isset($client['sort']['row']) ? $client['sort']['row'] : NULL) : NULL,
    'ascending' => $validate ? (isset($client['sort']['ascending']) ? $client['sort']['ascending'] : NULL) : NULL
  )
);

/* override the config value if the cookie value is set */
if($validate && isset($client['style']['compact']) && $client['style']['compact'])
{
  $config['style']['compact'] = $client['style']['compact'];
}

$sorting = array(
  'enabled' => $config['sorting']['enabled'],
  'order' => $config['sorting']['order'],
  'types' => $config['sorting']['types'],
  'sort_by' => strtolower($config['sorting']['sort_by'])
);

if($cookies['sorting']['row'] !== NULL)
{
  switch(intval($cookies['sorting']['row']))
  {
    case 0: $sorting['sort_by'] = 'name'; break;
    case 1: $sorting['sort_by'] = 'modified'; break;
    case 2: $sorting['sort_by'] = 'size'; break;
    case 3: $sorting['sort_by'] = 'type'; break;
  }
}

if($cookies['sorting']['ascending'] !== NULL)
{
  $sorting['order'] = (boolval($cookies['sorting']['ascending']) === true ? SORT_ASC : SORT_DESC);
}

if($cookies['sorting']['ascending'] !== NULL || $cookies['sorting']['row'] !== NULL)
{
  $sorting['enabled'] = true;
}

if(isset($_SERVER['INDEXER_BASE_PATH']))
{
  $base_path = $_SERVER['INDEXER_BASE_PATH'];
} else {
  $base_path = dirname(__FILE__);
}

try
{
  $indexer = new Indexer(
      rawurldecode($_SERVER['REQUEST_URI']),
      array(
          'path' => array(
            'relative' => $base_path
          ),
          'format' => array(
            'date' => isset($config['format']['date']) ? $config['format']['date'] : NULL,
            'sizes' => isset($config['format']['sizes']) ? $config['format']['sizes'] : NULL
          ),
          'directory_sizes' => $config['directory_sizes'],
          'client' => $client,
          'filter' => $config['filter'],
          'extensions' => $config['extensions'],
          'path_checking' => strtolower($config['path_checking']),
          'allow_direct_access' => $config['allow_direct_access']
      )
  );
} catch (Exception $e) {
  http_response_code(500);

  echo "<h3>Error:</h3><p>{$e} ({$e->getCode()})</p>";

  if($e->getCode() === 1 || $e->getCode() === 2)
  {
    echo '<p>This error occurs when the requested directory is below the directory of the PHP file.'.
    ($e->getCode() === 1 ? '<br/>You can try setting <b>path_checking</b> to <b>weak</b> if you are working with symbolic links etc.' : '') . '</p>';
  }

  exit('<p>Fatal error - Exiting.</p>');
}

$contents = $indexer->buildTable(
  $sorting['enabled'] ? $sorting['order'] : false,
  $sorting['enabled'] ? $sorting['types'] : 0,
  $sorting['enabled'] ? strtolower($sorting['sort_by']) : 'modified',
  $sorting['enabled'] ? $config['sorting']['use_mbstring'] : false
);

$data = $indexer->getLastData();

$counts = array(
    'files' => count($data['files']),
    'directories' => count($data['directories'])
);

$themes = array();

if($config['style']['themes']['path'])
{
  $directory = rtrim($indexer->joinPaths($base_path, $config['style']['themes']['path']), '/');

  if(is_dir($directory))
  {
    foreach(preg_grep('~\.css$~', scandir($directory, SCANDIR_SORT_NONE)) as $theme)
    {
      if($theme[0] != '.') array_push($themes, substr($theme, 0, strrpos($theme, '.')));
    }
  }

  if(count($themes) > 0) array_unshift($themes, 'default');
}

// $current_theme = count($themes) > 0 && is_array($client) && isset($client['style']['theme']) ? (in_array($client['style']['theme'], $themes) ? $client['style']['theme'] : NULL) : NULL;

$current_theme = NULL;

if(count($themes) > 0)
{
  if(is_array($client) && isset($client['style']['theme']))
  {
    $current_theme = in_array($client['style']['theme'], $themes) ? $client['style']['theme'] : NULL;
  } elseif(isset($config['style']['themes']['default']) && in_array($config['style']['themes']['default'], $themes))
  {
    $current_theme = $config['style']['themes']['default'];
  }
}

$compact = NULL;

if(is_array($client) && isset($client['style']['compact']))
{
  $compact = $client['style']['compact'];
} else {
  $compact = $config['style']['compact'];
}

$footer = $config['footer'] === true || $config['credits'] !== false;
?>
<!DOCTYPE HTML>
<html lang="en">
  <head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title><?=sprintf($config['format']['title'], $indexer->getCurrentDirectory());?></title>
    <link rel="shortcut icon" href="<?=$config['icon']['path'];?>" type="<?=$config['icon']['mime'];?>">

    <link rel="stylesheet" type="text/css" href="/indexer/css/style.css?v=<?=$version;?>">
    <?=($current_theme && strtolower($current_theme) !== 'default')  ? '<link rel="stylesheet" type="text/css" href="' . $config['style']['themes']['path'] . $current_theme . '.css?v=' . $version . '">' . PHP_EOL : ''?>

  </head>

  <body class="directory<?=$compact ? ' compact' : ''?><?=!$footer ? ' pb' : ''?>">

    <div class="top-bar">
        <div class="extend ns">&#x25BE;</div>
        <div class="directory-info">
          <div data-count="size"><?=$data['size']['readable'];?></div>
          <div <?=$data['recent']['file'] !== 0 ? 'data-raw="' . $data['recent']['file'] . '" ' : '';?>data-count="files"><?=$counts['files'] . ($counts['files'] === 1 ? ' file' : ' files');?></div>
          <div <?=$data['recent']['directory'] !== 0 ? 'data-raw="' . $data['recent']['directory'] . '" ' : '';?>data-count="directories"><?=$counts['directories'] . ($counts['directories'] === 1 ? ' directory' : ' directories');?></div>
        </div>
    </div>

    <div class="path">Index of <?=$indexer->makePathClickable($indexer->getCurrentDirectory());?></div>

 <table>
  <thead>
    <tr>
      <th><span sortable="true" title="Sort by filename">Filename</span><span class="sort-indicator"></span></th>
      <th><span sortable="true" title="Sort by modification date">Modified</span><span class="sort-indicator"></span></th>
      <th><span sortable="true" title="Sort by filesize">Size</span><span class="sort-indicator"></span></th>
      <th><span sortable="true" title="Sort by filetype">Options</span><span class="sort-indicator"></span></th>
    </tr>
  </thead>

  <?=$contents;?>
</table>

<?php
if($footer)
{
  echo '<div class="bottom">';

  echo ($config['footer'] === true) ? sprintf(
    '  <div>Page generated in %f seconds</div><div>Browsing <span>%s</span> @ <a href="/">%s</a></div>',
    (microtime(true) - $render), $indexer->getCurrentDirectory(), $_SERVER['SERVER_NAME']
  ) : '';

  echo ($config['credits'] !== false) ? sprintf(
    '<div class="git-reference%s">
    <a target="_blank" href="https://github.com/sixem/eyy-indexer">eyy-indexer</a><span class="version">%s</span>
  </div>',
      ($config['footer'] !== true ? ' single' : ''), $version
  ) : '';

  echo '</div>';
}
?>

<div class="filter-container">
    <div>
        <input type="text" placeholder="Search .." value="">
        <div class="status" data-view="desktop"></div>
    </div>
    <div class="close">
        <span>[Close]</span>
    </div>
</div>

<!-- [https://github.com/sixem/eyy-indexer] --> 

<script id="__INDEXER_DATA__" type="application/json"><?=(json_encode(array(
  'preview' => array(
    'enabled' => $config['preview']['enabled'],
    'hover_delay' => $config['preview']['hover_delay'],
    'cursor_indicator' => $config['preview']['cursor_indicator'],
  ),
  'sorting' => array(
    'enabled' => $sorting['enabled'],
    'types' => $sorting['types'],
    'sort_by' => strtolower($sorting['sort_by']),
    'order' => $sorting['order'] === SORT_ASC ? 'asc' : 'desc',
    'directory_sizes' => $config['directory_sizes']['enabled']
  ),
  'gallery' => array(
    'enabled' => $config['gallery']['enabled'],
    'reverse_options' => $config['gallery']['reverse_options'],
    'fade' => $config['gallery']['fade'],
    'scroll_interval' => $config['gallery']['scroll_interval'],
    'list_alignment' => $config['gallery']['list_alignment'],
    'fit_content' => $config['gallery']['fit_content']
  ),
  'extensions' => array(
    'image' => $config['extensions']['image'],
    'video' => $config['extensions']['video']
  ),
  'style' => array(
    'themes' => array(
      'path' => $config['style']['themes']['path'],
      'pool' => $themes,
      'set' => $current_theme ? $current_theme : 'default'
    ),
    'compact' => $config['style']['compact']
  ),
  'format' => array_intersect_key($config['format'], array_flip(array('sizes', 'date'))),
  'timestamp' => $indexer->timestamp,
  'debug' => $config['debug'],
  'mobile' => false
)));?>
</script>

<script type="text/javascript" src="/indexer/js/vendors.js?v=<?=$version;?>"></script>
<script type="text/javascript" src="/indexer/js/gallery.js?v=<?=$version;?>"></script>
<script type="text/javascript" src="/indexer/js/main.js?v=<?=$version;?>"></script>

</body>
</html>