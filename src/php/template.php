<?php

/**
 * <eyy-indexer> [https://github.com/sixem/eyy-indexer]
 *
 * @license  https://github.com/sixem/eyy-indexer/blob/master/LICENSE GPL-3.0
 * @author   emy (sixem@github) <emy@five.sh>
 * @version  <%= version %>
 */

/**
 * [Configuration]
 * A more in-depth overview can be found here:
 * https://github.com/sixem/eyy-indexer/blob/master/CONFIG.md
 */

/* Used to bust the cache and to display footer version number */
$version = '<%= version %>';

$config = array(
    /* Authentication options */
    'authentication' => false,
    /* Enables single-page features */
    'single_page' => false,
    /* Formatting options */
    'format' => array(
        'title' => 'Index of %s', /* Title format where %s is the current path */
        'date' => array('d/m/y H:i', 'd/m/y'), /* Date formats (desktop, mobile) */
        'sizes' => array(' B', ' KiB', ' MiB', ' GiB', ' TiB') /* Size formats */
    ),
    /* Favicon options */
    'icon' => array(
        'path' => '/favicon.ico', /* What favicon to use */
        'mime' => 'image/x-icon' /* Favicon mime type */
    ),
    /* Sorting options. Used as default until the client sets their own sorting settings */
    'sorting' => array(
        'enabled' => false, /* Whether the server should sort the items */
        'order' => SORT_ASC, /* Sorting order. asc or desc */
        'types' => 0, /* What item types to sort. 0 = both. 1 = files only. 2 = directories only */
        'sort_by' => 'name', /* What to sort by. available options are name, modified, type and size */
        'use_mbstring' => false /* Enabled mbstring when sorting */
    ),
    /* Gallery options */
    'gallery' => array(
        'enabled' => true, /* Whether the gallery plugin should be enabled */
        'reverse_options' => false, /* Reverse search options for images (when hovering over them) */
        'scroll_interval' => 50, /* Break in ms between scroll navigation events */
        'list_alignment' => 0, /* List alignment where 0 is right and 1 is left */
        'fit_content' => true, /* Whether the media should be forced to fill the screen space */
        'image_sharpen' => false, /* Attempts to disable browser blurriness on images */
    ),
    /* Preview options */
    'preview' => array(
        'enabled' => true, /* Whether the preview plugin should be enabled */
        'hover_delay' => 75, /* Delay in milliseconds before the preview is shown */
        'cursor_indicator' => true /* Displays a loading cursor while the preview is loading */
    ),
    /* Extension that should be marked as media.
     * These extensions will have potential previews and will be included in the gallery */
    'extensions' => array(
        'image' => array('jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'bmp', 'webp'),
        'video' => array('webm', 'mp4', 'ogg', 'ogv', 'mov')
    ),
    /* Injection options */
    'inject' => false,
    /* Styling options */
    'style' => array(
        /* Set to a path relative to the root directory (location of this file) containg .css files.
         * Each .css file will be treated as a separate theme. Set to false to disable themes */
        'themes' => array(
          'path' => false,
          'default' => false
        ),
         /* Cascading style sheets options */
        'css' => array(
          'additional' => false
        ),
        /* Enables a more compact styling of the page */
        'compact' => false
    ),
    /* Filter what files or directories to show.
     * Uses regular expressions. All names !matching! the regex will be shown.
     * Setting the value to false will disable the respective filter */
    'filter' => array(
        'file' => false,
        'directory' => false
    ),
    /* Calculates the size of directories.
     * This can be intensive, especially with the recursive option, so be aware of that */
    'directory_sizes' => array(
      /* Whether directory sizes should be calculated or not */
      'enabled' => false,
      /* Recursively scans the directories when calculating the size */
      'recursive' => false
    ),
    /* Processing functions */
    'processor' => false,
    /* Should ? and # characters be encoded when processing URLs */
    'encode_all' => false,
    /* Whether this .php file should be directly accessible */
    'allow_direct_access' => false,
    /* Set to 'strict' or 'weak'.
     * 'strict' uses realpath() to avoid backwards directory traversal whereas 'weak' uses a similar string-based approach */
    'path_checking' => 'strict',
    /* Enabled the performance mode */
    'performance' => false,
    /* Whether extra information in the footer should be generated (page load time, path etc.) */
    'footer' => array(
      'enabled' => true,
      'show_server_name' => true
    ),
    /* Displays a simple link to the git repository in the footer along with the current version.
     * I would really appreciate it if you would keep this enabled */
    'credits' => true,
    /* Enables console output in JS and PHP debugging.
     * Also enables random query-strings for js/css files to bust the cache */
    'debug' => true
);

/* Get current request URI */
$currentUri = rawurldecode($_SERVER['REQUEST_URI']);

/* Look for a config file in the current directory */
$configFile = (basename(__FILE__, '.php') . '.config.php');

/* Any potential libraries and so on for extra features will appear here */
<%= buildInject.readmeSupport &&
  buildInject.readmeSupport.PARSEDOWN_LIBRARY ?
  buildInject.readmeSupport.PARSEDOWN_LIBRARY : null %>

/* If found, it'll override the above configuration values.
 * Any unset values in the file will take the default values */
if(file_exists($configFile))
{
  $config = include($configFile);
} else if(file_exists('.' . $configFile)) /* Also check for hidden (.) file */
{
  $config = include('.' . $configFile);
}

/* Default configuration values. Used if values from the above config are unset */
$defaults = array('authentication' => false,'single_page' => false,'format' => array('title' => 'Index of %s','date' => array('m/d/y H:i', 'd/m/y'),'sizes' => array(' B', ' KiB', ' MiB', ' GiB', ' TiB')),'icon' => array('path' => '/favicon.png','mime' => 'image/png'),'sorting' => array('enabled' => false,'order' => SORT_ASC,'types' => 0,'sort_by' => 'name','use_mbstring' => false),'gallery' => array('enabled' => true,'reverse_options' => false,'scroll_interval' => 50,'list_alignment' => 0,'fit_content' => true,'image_sharpen' => false),'preview' => array('enabled' => true,'hover_delay' => 75,'cursor_indicator' => true),'extensions' => array('image' => array('jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'bmp', 'webp'),'video' => array('webm', 'mp4', 'ogv', 'ogg', 'mov')),'inject' => false,'style' => array('themes' => array('path' => false,'default' => false),'css' => array('additional' => false),'compact' => false),'filter' => array('file' => false,'directory' => false),'directory_sizes' => array('enabled' => false, 'recursive' => false),'processor' => false,'encode_all' => false,'allow_direct_access' => false,'path_checking' => 'strict','performance' => false,'footer' => array('enabled' => true, 'show_server_name' => true),'credits' => true,'debug' => false);

/* Authentication function */
function authenticate($users, $realm)
{
  function http_digest_parse($text)
  {
    /* Protect against missing data */
    $neededParts = array(
      'nonce' => 1,
      'nc' => 1,
      'cnonce' => 1,
      'qop' => 1,
      'username' => 1,
      'uri' => 1,
      'response' => 1
    );

    $data = array();
    $keys = implode('|', array_keys($neededParts));

    preg_match_all('@(' . $keys . ')=(?:([\'"])([^\2]+?)\2|([^\s,]+))@', $text, $matches, PREG_SET_ORDER);

    foreach($matches as $m)
    {
      $data[$m[1]] = $m[3] ? $m[3] : $m[4];
      unset($neededParts[$m[1]]);
    }

    return $neededParts ? false : $data;
  }

  /* Create header for when unathorized */
  function createHeader($realm)
  {
    header($_SERVER['SERVER_PROTOCOL'] . '401 Unauthorized');
    header('WWW-Authenticate: Digest realm="' . $realm . '",qop="auth",nonce="' . uniqid() . '",opaque="' . md5($realm) . '"');
  }

  /* Deny access if no digest is set */
  if(empty($_SERVER['PHP_AUTH_DIGEST']))
  {
    createHeader($realm);
    die('401 Unauthorized');
  }

  /* Get digest data */
  $data = http_digest_parse($_SERVER['PHP_AUTH_DIGEST']);

  /* Deny access if data is invalid or username is unset */
  if(!$data || !isset($users[$data['username']]))
  {
    createHeader($realm);
    die('Invalid credentials.');
  }

  $a1 = md5($data['username'] . ':' . $realm . ':' . $users[$data['username']]);
  $a2 = md5($_SERVER['REQUEST_METHOD'] . ':' . $data['uri']);

  $validResponse = md5($a1 . ':' . $data['nonce'] . ':' . $data['nc'] . ':' . $data['cnonce'] . ':' . $data['qop'] . ':' . $a2);

  /* Deny access if data can't be verified */
  if($data['response'] != $validResponse)
  {
    createHeader($realm);
    die('Invalid credentials.');
  }
}

/* Call authentication function if authentication is enabled */
if(isset($config['authentication']) &&
  $config['authentication'] &&
  is_array($config['authentication']))
{
  /* If `users` key is an array, make way for it and check for restrictions */
  if(isset($config['authentication']['users']) &&
    is_array($config['authentication']['users']))
  {
    $isRestricted = true;

    /* A `restrict` key is set, check if it matches current path */
    if(isset($config['authentication']['restrict']) &&
      is_string($config['authentication']['restrict']))
    {
      /* Check if `restrict` filter matches the current requested URI */
      $isRestricted = preg_match($config['authentication']['restrict'], $currentUri);
    }

    /* Restrict content if `restrict` filter matches successfully or it is unset */
    if($isRestricted)
    {
      authenticate($config['authentication']['users'], 'Restricted content.');
    }
  } else {
    /* Don't use any potential `users` array to authenticate, use main array instead */
    authenticate($config['authentication'], 'Restricted content.');
  }
}

/* Set default configuration values if the config is missing any keys.
 * This does not traverse too deep at all */
foreach($defaults as $key => $value)
{
  if(!isset($config[$key]))
  {
    $config[$key] = $defaults[$key];
  } else if(is_array($config[$key]) &&
    is_array($defaults[$key]))
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

$footer = array(
  'enabled' => is_array($config['footer']) ? ($config['footer']['enabled'] ? true : false) : ($config['footer'] ? true : false),
  'show_server_name' => is_array($config['footer']) ? $config['footer']['show_server_name'] : true
);

/* Set start time for page render calculations */
if($footer['enabled'])
{
  $render = microtime(true);
}

/* Enable debugging if enabled */
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

  private $relative;

  private $pathPrepend;

  private $requested;

  private $types;

  private $allow_direct;

  private $encode_all;

  function __construct($path, $options = array())
  {
    /* Get requested path */
    $requested = rawurldecode(strpos($path, '?') !== false ? explode('?', $path)[0] : $path);

    /* Set relative path */
    if(isset($options['path']['relative'])
      && $options['path']['relative'] !== NULL)
    {
      $this->relative = $options['path']['relative'];
    } else {
      $this->relative = dirname(__FILE__);
    }

    /* Set encode all options */
    $this->encode_all = $options['encode_all'] ? true : false;

    if(isset($options['path']['prepend'])
      && $options['path']['prepend'] !== NULL
      && strlen($options['path']['prepend']) >= 1)
    {
      $this->pathPrepend = ltrim(rtrim($options['path']['prepend'], '/'), '/');
    } else {
      $this->pathPrepend = NULL;
    }

    /* Declare array for optional processing of data */
    $this->processor = array(
      'item' => NULL
    );

    /* Check for passed processing functions */
    if(isset($options['processor']) && is_array($options['processor']))
    {
      if(isset($options['processor']['item']))
      {
        $this->processor['item'] = $options['processor']['item'];
      }
    }

    /* Set remaining options/variables */
    $this->client = isset($options['client']) ? $options['client'] : NULL;
    $this->allow_direct = isset($options['allow_direct_access']) ? $options['allow_direct_access'] : true;
    $this->path = rtrim(self::joinPaths($this->relative, $requested), '/');
    $this->timestamp = time();
    $this->directory_sizes = $options['directory_sizes'];

    /* Is requested path a directory? */
    if(is_dir($this->path))
    {
      /* Check if the directory is above the base directory (or same level) */
      if(self::isAboveCurrent($this->path, $this->relative))
      {
        $this->requested = $requested;
      } else {
        /* Directory is below the base directory */
        if($options['path_checking'] === 'strict' || $options['path_checking'] !== 'weak')
        {
          throw new Exception("requested path (is_dir) is below the public working directory. (mode: {$options['path_checking']})", 1);
        } else if($options['path_checking'] === 'weak')
        {
          /* If path checking is 'weak' do another test using a 'realpath' alternative instead (string-based approach which doesn't solve links) */
          if(self::isAboveCurrent($this->path, $this->relative, false) || is_link($this->path))
          {
            $this->requested = $requested;
          } else {
            /* Even the 'weak' check failed, throw an exception */
            throw new Exception("requested path (is_dir) is below the public working directory. (mode: {$options['path_checking']})", 2);
          }
        }
      }
    } else {
      /* Is requested path a file (this can only be the indexer as we don't have control over any other files)? */
      if(is_file($this->path))
      {
        /* If direct access is disabled, deny access */
        if($this->allow_direct === false)
        {
          http_response_code(403); die('Forbidden');
        } else {
          /* If direct access is allowed, show current directory of script (if it is above base directory) */
          $this->path = dirname($this->path);

          if(self::isAboveCurrent($this->path, $this->relative))
          {
            $this->requested = dirname($requested);
          } else {
            throw new Exception('requested path (is_file) is below the public working directory.', 3);
          }
        }
      } else {
        /* If requested path is neither a file nor a directory */
        throw new Exception('invalid path. path does not exist.', 4);
      }
    }

    /* Set extension variables */
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
          'webp' => 'image',
          'webm' => 'video',
          'mp4' => 'video',
          'ogg' => 'video',
          'ogv' => 'video'
        );
    }

    /* Set filter variables */
    if(isset($options['filter']) && is_array($options['filter']))
    {
      $this->filter = $options['filter'];
    } else {
      $this->filter = array(
        'file' => false,
        'directory' =>  false
      );
    }

    /* Set size format variables */
    if(isset($options['format']['sizes']) && $options['format']['sizes'] !== NULL)
    {
      $this->format['sizes'] = $options['format']['sizes'];
    } else {
      $this->format['sizes'] = array(' B', ' KiB', ' MiB', ' GiB', ' TiB', ' PB', ' EB', ' ZB', ' YB');
    }

    $this->format['date'] = $options['format']['date'];
  }

  /* Handles pathing by taking any potential prepending into mind */
  private function handlePathing($path, $isDir = true)
  {
    $path = ltrim(rtrim($path, '/'), '/');

    if($this->pathPrepend)
    {
      if(!empty($path))
      {
        $path = sprintf(
          '/%s/%s%s',
          $this->pathPrepend,
          $path,
          $isDir ? '/' : ''
        );
      } else {
        $path = '/' . $this->pathPrepend . '/';
      }
    } else {
      $path = ('/' . $path . (!empty($path) && $isDir ? '/' : ''));
    }

    return $path;
  }

  /* Gets file/directory information and constructs the HTML of the table */
  public function buildTable($sorting = false, $sort_items = 0, $sort_type = 'modified', $use_mb = false)
  {
    /* Get client timezone offset */

    $cookies = array(
      'timezone_offset' => intval(is_array($this->client) ? (isset($this->client['timezone_offset']) ? $this->client['timezone_offset'] : 0) : 0)
    );

    $timezone = array(
      'offset' => $cookies['timezone_offset'] > 0 ? -$cookies['timezone_offset'] * 60 : abs($cookies['timezone_offset']) * 60
    );

    /* Gets the filename of this .php file. Used to hide it from the folder */
    $script_name = basename(__FILE__);
    /* Gets the current directory */
    $directory = self::getCurrentDirectory();
    /* Gets the files from the current path using 'scandir' */
    $files = self::getFiles();
    /* Is this the base directory (/)?*/
    $is_base = ($directory === '/');

    $parentDirectory = dirname($directory);
    $parentHref = $this->handlePathing($parentDirectory, true);

    if($this->pathPrepend)
    {
      $prependedCurrent = ltrim(rtrim($this->joinPaths($this->pathPrepend, $directory), '/'), '/');
      $prependedRoot = ltrim(rtrim($this->pathPrepend, '/'), '/');

      if($prependedCurrent === $prependedRoot)
      {
        $steppedPath = dirname('/' . $prependedRoot . '/');
        
        $parentHref = str_replace(
          '\\\\', '\\', $steppedPath . (substr($steppedPath, -1) === '/' ? '' : '/')
        );
      }
    }

    $op = '<tr class="parent"><td><a href="' . $parentHref . '">' . 
          '[Parent Directory]</a></td><td><span>-</span></td><td>'.
          '<span>-</span></td><td><span>-</span></td></tr>';

    $data = array(
      'files' => array(),
      'directories' => array(),
      'readme' => NULL,
      'recent' => array(
        'file' => 0,
        'directory' => 0
      ),
      'size' => array(
        'total' => 0,
        'readable' => 'N/A'
      )
    );

    /* Hide directories / files if they match the filter or if they are indexer components */
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
        if($file === 'README.md')
        {
          $data['readme'] = $path;
        }
        
        if($is_base && $file === $script_name)
        {
          continue;
        } else if($this->filter['file'] !== false)
        {
          $skippable = false;

          if(is_array($this->filter['file']))
          {
            foreach($this->filter['file'] as $filter)
            {
              if(!preg_match($filter, $file))
              {
                $skippable = true; break;
              }
            }
          } else if(!$skippable) {
            $skippable = !preg_match($this->filter['file'], $file);
          }

          if($skippable)
          {
            continue;
          }
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

      /* We only need to set 'name' key if we're sorting by name */
      if($sort_type === 'name')
      {
        $item['name'] = $use_mb === true ? mb_strtolower($dir[1], 'UTF-8') : strtolower($dir[1]);
      }

      /* Set directory data values */
      $item['modified'] = self::getModified($dir[0], $timezone['offset']);
      $item['type'] = 'directory';
      $item['size'] = $this->directory_sizes['enabled'] ? ($this->directory_sizes['recursive'] ? self::getDirectorySizeRecursively($dir[0]) : self::getDirectorySize($dir[0])) : 0;
      $item['url'] = rtrim(self::joinPaths($this->requested, $dir[1]), '/');
    }

    foreach($data['files'] as $index => $file)
    {
      $item = &$data['files'][$index];

      /* We only need to set 'name' key if we're sorting by name */
      if($sort_type === 'name')
      {
        $item['name'] = $use_mb === true ? mb_strtolower($file[1], 'UTF-8') : strtolower($file[1]);
      }

      /* Set file data values */
      $item['type'] = self::getFileType($file[1]);
      $item['size'] = self::getSize($file[0]);
      $item['modified'] = self::getModified($file[0], $timezone['offset']);
      $item['url'] = rtrim(self::joinPaths($this->requested, $file[1]), '/');

      if($this->encode_all)
      {
        $item['url'] = str_replace('?', '%3F', str_replace('#', '%23', $item['url']));
      }
    }

    /* Pass data to processor if it is set */
    if($this->processor['item'])
    {
      $data = $this->processor['item']($data, $this);
    }

    /* Sort items server-side */
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

    /* Iterate over the directories, get and store data */
    foreach($data['directories'] as $dir)
    {
      if($this->directory_sizes['enabled'])
      {
        $data['size']['total'] = ($data['size']['total'] + $dir['size']);
      }

      $op .= sprintf(
        '<tr class="directory"><td data-raw="%s"><a href="%s">[%s]</a>' .
        '</td><td data-raw="%s"><span>%s</span></td>',
        $dir[1],
        $this->handlePathing($dir['url'], true),
        $dir[1],
        $dir['modified'][0],
        $dir['modified'][1]
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

      $op .= '<td><span>-</span></td></tr>';
    }

    /* Iterate over the files, get and store data */
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
        (($file['type'][0] === 'image' || $file['type'][0] === 'video'
          ? true
          : false)
            ? ' class="preview" '
            : ' '),
        $this->handlePathing($file['url'], false),
        $file[1]
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
        $file['type'][0], $file['url'], $file[1], ('<span data-view="mobile">[Save]</span><span data-view="desktop">[Download]</span>')
      );
    }

    $data['size']['readable'] = self::readableFilesize($data['size']['total']);

    $this->data = $data;

    return $op;
  }

  /* Gets the current files from set path */
  private function getFiles()
  {
    return scandir($this->path, SCANDIR_SORT_NONE);
  }

  /* A 'realpath' alternative, doesn't resolve links, relies purely on strings instead.
   * Used with 'weak' path checking */
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

  /* Checks if $path is above $base. Reverse path traversal is bad? */
  private function isAboveCurrent($path, $base, $use_realpath = true)
  {
    return self::startsWith($use_realpath ? realpath($path) : self::removeDotSegments($path), $use_realpath ? realpath($base) : self::removeDotSegments($base));
  }

  /* Some data is stored in $this->data, this retrieves that */
  public function getLastData()
  {
    return isset($this->data) ? $this->data : false;
  }

  /* Gets the current directory */
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

  /* Identifies file type by matching it against the extension arrays */
  private function getFileType($filename)
  {
    $extension = strtolower(ltrim(pathinfo($filename, PATHINFO_EXTENSION), '.'));

    return array(isset($this->types[$extension]) ? $this->types[$extension] : 'other', $extension);
  }

  /* Converts the current path into clickable a[href] links */
  public function makePathClickable($path)
  {
	  $path = $this->handlePathing($path, true);

    $paths = explode('/', ltrim($path, '/'));

    $output = ('<a href="/">/</a>');

    foreach($paths as $i => $p)
    {
      $i++; $text = (($i !== 1 ? '/' : '') . $p);

      if($text === '/') continue;

      if($i === count($paths) - 1)
      {
        $text = rtrim($text, '/') . '/';
      }

      $anchor = implode('/', array_slice($paths, 0, $i));
      $output .= sprintf('<a href="/%s">%s</a>', $anchor, $text);
    }

    return $output;
  }

  /* Formats a unix timestamp */
  private function formatDate($format, $stamp, $modifier = 0)
  {
    return gmdate($format, $stamp + $modifier);
  }

  /* Gets the last modified date of a file */
  private function getModified($path, $modifier = 0)
  {
    $stamp = filemtime($path);

    if(count($this->format['date']) === 2)
    {
      $formatted = "";

      for($i = 0; $i < 2; ++$i)
      {
        $format = self::formatDate(
          $this->format['date'][$i], $stamp, $modifier
        );

        $formatted .= sprintf(
          "<span data-view=\"%s\">%s</span>", $i === 0 ? 'desktop' : 'mobile', $format
        );
      }
    } else {
      $formatted = self::formatDate($this->format['date'][0], $stamp, $modifier);
    }

    return array($stamp, $formatted);
  }

  /* Gets a client cookie key (if it exists) */
  private function getCookie($key, $default = NULL)
  {
    return isset($_COOKIE[$key]) ? $_COOKIE[$key] : $default;
  }

  /* Gets the size of a file */
  private function getSize($path)
  {
    $fs = filesize($path);
    $size = ($fs < 0 ? -1 : $fs);

    return array($size, self::readableFilesize($size));
  }

  /* Gets the size of a directory */
  private function getDirectorySize($path)
  {
    $size = 0;

    try
    {
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
    } catch (Exception $e)
    {
      $size += 0;
    }

    return $size;
  }

  /* Gets the full size of a director using */
  private function getDirectorySizeRecursively($path)
  {
    $size = 0;
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path));

    try
    {
      foreach($iterator as $file)
      {
        if($file->isDir())
        {
          continue;
        } else {
          $size += filesize($file->getPathname());
        }
      }
    } catch (Exception $e)
    {
      $size += 0;
    }

    return $size;
  }

  /* Converts bytes to a readable file size */
  private function readableFilesize($bytes, $decimals = 1)
  {
    if($bytes === 0)
    {
      return '0' . $this->format['sizes'][0];
    }

    $base = log($bytes, 1024);
    $floored = floor($base);
    $value = pow(1024, $base - $floored);

    if($value >= 100)
    {
      $decimals = 0;
    }

    return round($value, $decimals) . $this->format['sizes'][$floored];
  }

  /* Checks if a string starts with a string */
  private function startsWith($haystack, $needle)
  {
    return $needle === '' || strrpos($haystack, $needle, - strlen($haystack)) !== false;
  }

  /* Concentrates path components into a merged path */
  public function joinPaths(...$params)
  {
    $paths = array();

    foreach($params as $param)
    {
      if($param !== '')
      {
        $paths[] = $param;
      }
    }

    return preg_replace('#/+#','/', join('/', $paths));
  }
}

/* Is cookie set? */
$client = isset($_COOKIE['ei-client']) ? $_COOKIE['ei-client'] : NULL;

/* If client cookie is set, parse it */
if($client)
{
  $client = json_decode($client, true);
}

/* Validate that the cookie is a valid array */
$validate = is_array($client);

$cookies = array(
  'sorting' => array(
    'row' => $validate ? (isset($client['sort']['row']) ? $client['sort']['row'] : NULL) : NULL,
    'ascending' => $validate ? (isset($client['sort']['ascending']) ? $client['sort']['ascending'] : NULL) : NULL
  )
);

/* Override the config value if the cookie value is set */
if($validate && isset($client['style']['compact']) && $client['style']['compact'])
{
  $config['style']['compact'] = $client['style']['compact'];
}

/* Set sorting settings */
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

/* Get `INDEXER_BASE_PATH` if set */
if(isset($_SERVER['INDEXER_BASE_PATH']))
{
  $basePath = $_SERVER['INDEXER_BASE_PATH'];
} else {
  $basePath = dirname(__FILE__);
}

/* Get `INDEXER_PREPEND_PATH` if set */
if(isset($_SERVER['INDEXER_PREPEND_PATH']))
{
  $prependPath = $_SERVER['INDEXER_PREPEND_PATH'];
} else if(isset($_SERVER['HTTP_X_INDEXER_PREPEND_PATH']))
{
  $prependPath = $_SERVER['HTTP_X_INDEXER_PREPEND_PATH'];
} else {
  $prependPath = '';
}


try
{
  /* Call class with options set */
  $indexer = new Indexer(
      $currentUri,
      array(
          'path' => array(
            'relative' => $basePath,
            'prepend' => $prependPath
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
          'processor' => $config['processor'],
          'encode_all' => $config['encode_all'],
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

/* Call 'buildTable', get content */
$contents = $indexer->buildTable(
  $sorting['enabled'] ? $sorting['order'] : false,
  $sorting['enabled'] ? $sorting['types'] : 0,
  $sorting['enabled'] ? strtolower($sorting['sort_by']) : 'modified',
  $sorting['enabled'] ? $config['sorting']['use_mbstring'] : false
);

$data = $indexer->getLastData();

$itemsTotal = (count($data['files']) + count($data['directories']));

/* Check if performance mode depends on item count */
if(is_int($config['performance']))
{
  $itemsTotal = (count($data['files']) + count($data['directories']));

  if($itemsTotal >= $config['performance'])
  {
    $config['performance'] = true;
  } else {
    $config['performance'] = false;
  }
}

/* Set some data like file count etc */
$counts = array(
    'files' => count($data['files']),
    'directories' => count($data['directories'])
);

$themes = array();

/* Are themes enabled? */
if($config['style']['themes']['path'])
{
  /* Trim the string of set directory path */
  $directory = rtrim($indexer->joinPaths($basePath, $config['style']['themes']['path']), '/');

  /* If set theme path is valid directory, scan it for .css files and add them to the theme pool */
  if(is_dir($directory))
  {
    foreach(preg_grep('~\.css$~', scandir($directory, SCANDIR_SORT_NONE)) as $theme)
    {
      if($theme[0] !== '.') array_push($themes, substr($theme, 0, strrpos($theme, '.')));
    }
  }

  /* Prepend default theme to the beginning of the array */
  if(count($themes) > 0) array_unshift($themes, 'default');
}

$currentTheme = NULL;

if(count($themes) > 0)
{
  /* Check if a theme is already set */
  if(is_array($client) && isset($client['style']['theme']))
  {
    $currentTheme = in_array($client['style']['theme'], $themes) ? $client['style']['theme'] : NULL;
  } elseif(isset($config['style']['themes']['default']) && in_array($config['style']['themes']['default'], $themes))
  {
    $currentTheme = $config['style']['themes']['default'];
  }
}

$compact = NULL;

/* Apply compact mode if that is set */
if(is_array($client) && isset($client['style']['compact']))
{
  $compact = $client['style']['compact'];
} else {
  $compact = $config['style']['compact'];
}

/* Used to bust the cache (query-strings for js and css files) */
$bust = md5($config['debug'] ? time() : $version);

/* Set any additional CSS */
$additionalCss = "<%= additonalCss ? additonalCss.join('') : null %>";

if(is_array($config['style']['css']['additional']))
{
  foreach($config['style']['css']['additional'] as $key => $value)
  {
    $selector = $key;
    $values = (string) NULL;

    foreach($value as $key => $value)
    {
      $values .= sprintf('%s:%s;', $key, rtrim($value, ';'));
    }

    $additionalCss .= sprintf('%s{%s}', $selector, $values);
  }
} else if(is_string($config['style']['css']['additional']))
{
  $additionalCss .= str_replace('"', '\"', $config['style']['css']['additional']);
}

/* Default stylesheet output */
$baseStylesheet = '<link rel="stylesheet" type="text/css" href="<%= indexerPath %>css/style.css?bust=' . $bust . '">';

/* Alternative stylesheet output for when single-page is enabled */
if($config['single_page'])
{
  /* Check if `navigateType` is set */
  if($_SERVER['REQUEST_METHOD'] === 'POST' && 
    isset($_POST['navigateType']) && $_POST['navigateType'] === 'dynamic')
  {
    /* Set a header to identify the response on the client side */
    header('navigate-type: dynamic');

    $stylePath = $indexer->joinPaths($basePath, '<%= indexerPath %>', '/css/style.css');

    if(file_exists($stylePath))
    {
      $styleData = file_get_contents($stylePath);

      /* If any additional CSS is set, merge that with this output */
      if(!empty($additionalCss))
      {
        $styleData .= (' ' . $additionalCss);
        $additionalCss = '';
      }

      $baseStylesheet = sprintf('<style type="text/css">%s</style>' . PHP_EOL, $styleData);
    }
  }
}

/* Passed to any inject functions that are called from config */
$injectPassableData = array();

if($config['inject'])
{
  /* Current path */
  $injectPassableData['path'] = $indexer->getCurrentDirectory();
  /* Get file and directory counts */
  $injectPassableData['counts'] = $counts;
  /* Get directory size */
  $injectPassableData['size'] = $data['size'];
  /* Pass config values */
  $injectPassableData['config'] = $config;
}

/* Gets the inject options */
$getInjectable = function($key) use ($config, $injectPassableData)
{
  if($config['inject'] && array_key_exists($key, $config['inject']))
  {
    if($config['inject'][$key])
    {
      if(is_string($config['inject'][$key]))
      {
        return $config['inject'][$key] . PHP_EOL;
      } else if(is_callable($config['inject'][$key]))
      {
        return $config['inject'][$key]($injectPassableData) . PHP_EOL;
      }
    }
    return PHP_EOL;
  } else {
    return PHP_EOL;
  }
}
?>
<!DOCTYPE HTML>
<html lang="en">
  <head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title><?=sprintf($config['format']['title'], $indexer->getCurrentDirectory());?></title>
    
    <link rel="shortcut icon" href="<?=$config['icon']['path'];?>" type="<?=$config['icon']['mime'];?>">

    <?=$baseStylesheet;?>
    <?=($currentTheme && strtolower($currentTheme) !== 'default')  ? '<link rel="stylesheet" type="text/css" href="' . $config['style']['themes']['path'] . $currentTheme . '.css?bust=' . $bust . '">' . PHP_EOL : ''?>

    <script defer type="text/javascript" src="<%= indexerPath %>main.js?bust=<?=$bust;?>"></script>
    <?=!(empty($additionalCss)) ? sprintf('<style type="text/css">%s</style>' . PHP_EOL, $additionalCss) : PHP_EOL?>
    <?=$getInjectable('head');?>
  </head>

  <body class="rootDirectory<?=$compact ? ' compact' : ''?><?=!$footer['enabled'] ? ' pb' : ''?>" is-loading<?=$config['performance'] ? ' optimize' : '';?> root>
    <?=$getInjectable('body');?>

    <div class="topBar">
        <div class="extend">&#9881;</div>
        <div class="directoryInfo">
          <div data-count="size"><?=$data['size']['readable'];?></div>
          <div <?=$data['recent']['file'] !== 0 ? 'data-raw="' . $data['recent']['file'] . '" ' : '';?>data-count="files"><?=$counts['files'] . ($counts['files'] === 1 ? ' file' : ' files');?></div>
          <div <?=$data['recent']['directory'] !== 0 ? 'data-raw="' . $data['recent']['directory'] . '" ' : '';?>data-count="directories"><?=$counts['directories'] . ($counts['directories'] === 1 ? ' directory' : ' directories');?></div>
        </div>
    </div>

    <div class="path">Index of <?=$indexer->makePathClickable($indexer->getCurrentDirectory());?></div>
    <%= buildInject.readmeSupport &&
      buildInject.readmeSupport.DISPLAY_SNIPPET ?
      buildInject.readmeSupport.DISPLAY_SNIPPET : null %>

    <div class="tableContainer">
      <table>
      <thead>
        <tr>
          <th><span sortable="true" title="Sort by filename">Filename</span><span class="sortingIndicator"></span></th>
          <th><span sortable="true" title="Sort by modification date">Modified</span><span class="sortingIndicator"></span></th>
          <th><span sortable="true" title="Sort by filesize">Size</span><span class="sortingIndicator"></span></th>
          <th><span sortable="true" title="Sort by filetype">Type</span><span class="sortingIndicator"></span></th>
        </tr>
      </thead>

      <?=$contents;?>

      </table>
    </div>
<?php
if($footer['enabled'])
{
  echo '<div class="bottom">';

  echo sprintf(
    '  <div class="%s">Page generated in <span class="%s">%f</span> seconds</div><div>Browsing <span>%s</span>%s</div>',
    'currentPageInfo',
    'generationTime',
    microtime(true) - $render,
    $indexer->getCurrentDirectory(),
    $footer['show_server_name'] && !empty($_SERVER['SERVER_NAME']) ? sprintf(' @ <a href="/">%s</a>', $_SERVER['SERVER_NAME']) : ''
  );

  echo ($config['credits'] !== false) ? sprintf(
    '<div class="referenceGit">
    <a target="_blank" href="https://github.com/sixem/eyy-indexer">eyy-indexer</a><span class="version">%s</span>
  </div>', $version
  ) : '';

  echo '</div>';
}
?>

<div class="filterContainer" style="display: none;">
    <input type="text" placeholder="Search .." value="">
</div>

<!-- [https://github.com/sixem/eyy-indexer] -->  

<script id="__INDEXER_DATA__" type="application/json"><?=(json_encode(array(
  'bust' => $bust,
  'singlePage' => $config['single_page'],
  'preview' => array(
    'enabled' => $config['preview']['enabled'],
    'hoverDelay' => $config['preview']['hover_delay'],
    'cursorIndicator' => $config['preview']['cursor_indicator'],
  ),
  'sorting' => array(
    'enabled' => $sorting['enabled'],
    'types' => $sorting['types'],
    'sortBy' => strtolower($sorting['sort_by']),
    'order' => $sorting['order'] === SORT_ASC ? 'asc' : 'desc',
    'directorySizes' => $config['directory_sizes']['enabled']
  ),
  'gallery' => array(
    'enabled' => $config['gallery']['enabled'],
    'reverseOptions' => $config['gallery']['reverse_options'],
    'scrollInterval' => $config['gallery']['scroll_interval'],
    'listAlignment' => $config['gallery']['list_alignment'],
    'fitContent' => $config['gallery']['fit_content'],
    'imageSharpen' => $config['gallery']['image_sharpen']
  ),
  'extensions' => array(
    'image' => $config['extensions']['image'],
    'video' => $config['extensions']['video']
  ),
  'style' => array(
    'themes' => array(
      'path' => $config['style']['themes']['path'],
      'pool' => $themes,
      'set' => $currentTheme ? $currentTheme : 'default'
    ),
    'compact' => $config['style']['compact']
  ),
  'format' => array_intersect_key($config['format'], array_flip(array('sizes', 'date', 'title'))),
  'encodeAll' => $config['encode_all'],
  'performance' => $config['performance'],
  'timestamp' => $indexer->timestamp,
  'debug' => $config['debug'],
  'mobile' => false
)));?>
</script>

<script type="text/javascript">function getScrollbarWidth(){const e=document.createElement("div");e.style.visibility="hidden",e.style.overflow="scroll",e.style.msOverflowStyle="scrollbar",document.body.appendChild(e);const t=document.createElement("div");e.appendChild(t);const l=e.offsetWidth-t.offsetWidth;return e.parentNode.removeChild(e),l};document.documentElement.style.setProperty('--scrollbar-width', getScrollbarWidth() + 'px');</script>
<?=$getInjectable('footer');?>
</body>
</html>