<?php

/**
 * <eyy-indexer> [https://github.com/sixem/eyy-indexer]
 *
 * @license  https://github.com/sixem/eyy-indexer/blob/master/LICENSE GPL-3.0
 * @author   emy <admin@eyy.co>
 * @version  1.1.5
 */

/* Configuration */
$config = array(
    'format' => array(
        'title' => 'Index of %s',
        'sizes' => array(' B', ' kB', ' MB', ' GB', ' TB')
    ),
    'icon' => array(
        'path' => '/favicon.png',
        'mime' => 'image/png'
    ),
    'sorting' => array(
        'enabled' => false,
        'order' => SORT_ASC,
        'types' => 0,
        'sort_by' => 'name',
        'use_mbstring' => false
    ),
    'gallery' => array(
        'enabled' => true,
        'fade' => 0,
        'reverse_options' => false,
        'scroll_interval' => 50,
        'list_alignment' => 0
    ),
    'preview' => array(
        'enabled' => true,
        'static' => false,
        'hover_delay' => 75,
        'window_margin' => 0,
        'cursor_indicator' => true
    ),
    'extensions' => array(
        'image' => array('jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp'),
        'video' => array('webm', 'mp4')
    ),
    'filter' => array(
        'file' => false,
        'directory' => false
    ),
    'themes' => false,
    'allow_direct_access' => false,
    'path_checking' => 'strict',
    'footer' => true,
    'debug' => true
);

/* Set default configuration values */
$config = array_merge(array('format'=>array('title'=>'Index of %s','sizes'=>array(' B',' kB',' MB',' GB',' TB')),'icon'=>array('path'=>'/favicon.png','mime'=>'image/png'),'sorting'=>array('enabled'=>false,'order'=>SORT_ASC,'types'=>0,'sort_by'=>'name','use_mbstring'=>false),'gallery'=>array('enabled'=>true,'fade'=>0,'reverse_options'=>true,'scroll_interval'=>50,'list_alignment'=>0),'preview'=>array('enabled'=>true,'static'=>false,'hover_delay'=>75,'window_margin'=>0,'cursor_indicator'=>true),'extensions'=>array('image'=>array('jpg','jpeg','gif','png','ico','svg','bmp'),'video'=>array('webm','mp4')),'filter'=>array('file'=>false,'directory'=>false),'themes'=>false,'allow_direct_access'=>false,'path_checking'=>'strict','footer'=>true,'debug'=>true), isset($config) && is_array($config) ? $config : array());

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

if($config['themes'] && $config['themes'][0] !== '/')
{
  $config['themes'] = ('/' . $config['themes']);
}

if(substr($config['themes'], -1) !== '/')
{
  $config['themes'] = ($config['themes'] . '/');
}

class Indexer
{
  public $path;
  private $relative, $requested, $types, $allow_direct;

  function __construct($path, $options = array())
  {
    $requested = urldecode(strpos($path, '?') !== false ? explode('?', $path)[0] : $path);

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
      $this->sizes = $options['format']['sizes'];
    } else {
      $this->sizes = array(' B', ' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB');
    }
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

    $offset_hours = (($timezone['offset'] / 60) / 60);
    $timezone['readable'] = ('UTC' . ($offset_hours > 0 ? '+' : '') . $offset_hours);

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
      $item['size'] = 0;
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
      $modtitle = $dir['modified'][2] ? "{$dir['modified'][2]} ({$timezone['readable']})" : '';

      $op .= sprintf(
        '<tr class="directory"><td data-raw="%s"><a href="%s">[%s]</a></td><td data-raw="%s"><span title="%s">%s</span></td><td>-</td><td>-</td></tr>',
        $dir[1], rtrim(self::joinPaths($this->requested, $dir[1]), '/'), $dir[1], $dir['modified'][0], $modtitle, $dir['modified'][1]
      );

      if($data['recent']['directory'] === 0 || $dir['modified'][0] > $data['recent']['directory'])
      {
        $data['recent']['directory'] = $dir['modified'][0];
      }
    }

    foreach($data['files'] as $file)
    {
      $modtitle = $file['modified'][2] ? "{$file['modified'][2]} ({$timezone['readable']})" : '';

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
        '<td data-raw="%d"><span title="%s">%s</span></td>',
        $file['modified'][0], $modtitle, $file['modified'][1]
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

    foreach(array('file', 'directory') as $type)
    {
      if($data['recent'][$type] > 0)
      {
        $data['recent'][$type] = self::formatDate('d/m/y H:i', $data['recent'][$type], $timezone['offset']);
      }
    }

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

  private function formatSince($seconds)
  {
    if($seconds === 0) { return 'Now'; } else if($seconds < 0) { return false; }

    $t = array(
      'year' => 31556926,
      'month' => 2629743,
      'week' => 604800,
      'day' => 86000,
      'hour' => 3600,
      'minute' => 60,
      'second' => 1
    );

    $index = 0; $count = count($t) - 1; $keys = array_keys($t);

    foreach($t as $key => $i)
    {
      $index++;

      if($seconds <= $i) continue;

      $n = $count >= $index ? $keys[$index] : NULL;
      $f = floor($seconds / $i);
      $s = $n ? floor(($seconds - ($f * $i)) / $t[$n]) : 0;

      return $f . ' ' . $key . ($f == 1 ? '' : 's') .
      ($s > 0 ? (' and ' . $s . ' ' . $n . ($s == 1 ? '' : 's')) : '') . ' ago';
    }

    return false;
  }

  private function formatDate($format, $stamp, $modifier = 0)
  {
    return gmdate($format, $stamp + $modifier);
  }

  private function getModified($path, $modifier = 0)
  {
    $stamp = filemtime($path);

    return array(
      $stamp,
      self::formatDate('d/m/y <\s\p\a\n \d\a\t\a-\v\i\e\w="\d\e\s\k\t\o\p">H:i\<\/\s\p\a\n\>', $stamp, $modifier),
      self::formatSince($this->timestamp - $stamp)
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

  private function readableFilesize($bytes, $decimals = 2)
  {
    if($bytes === -1) return '-';

    $factor = floor((strlen($bytes) - 1) / 3);

    $x = @$this->sizes[$factor];

    if($bytes > 104857600 || $factor == 0)
    {
      $decimals = 0;
    }

    if($x === $this->sizes[1]) $decimals = 0;

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
if($client) $client = json_decode($client, true);

$cookies = array(
  'sort_row' => is_array($client) ? (isset($client['sort']['row']) ? $client['sort']['row'] : NULL) : NULL,
  'sort_ascending' => is_array($client) ? (isset($client['sort']['ascending']) ? $client['sort']['ascending'] : NULL) : NULL
);

$sorting = array(
  'enabled' => $config['sorting']['enabled'],
  'order' => $config['sorting']['order'],
  'types' => $config['sorting']['types'],
  'sort_by' => strtolower($config['sorting']['sort_by'])
);

if($cookies['sort_row'] !== NULL)
{
  switch(intval($cookies['sort_row']))
  {
    case 0: $sorting['sort_by'] = 'name'; break;
    case 1: $sorting['sort_by'] = 'modified'; break;
    case 2: $sorting['sort_by'] = 'size'; break;
    case 3: $sorting['sort_by'] = 'type'; break;
  }
}

if($cookies['sort_ascending'] !== NULL)
{
  $sorting['order'] = (boolval($cookies['sort_ascending']) === true ? SORT_ASC : SORT_DESC);
}

if($cookies['sort_ascending'] !== NULL || $cookies['sort_row'] !== NULL)
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
      urldecode($_SERVER['REQUEST_URI']),
      array(
          'path' => array(
              'relative' => $base_path
          ),
          'format' => array(
              'sizes' => isset($config['format']['sizes']) ? $config['format']['sizes'] : NULL
          ),
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

if($config['themes'])
{
  $directory = rtrim($indexer->joinPaths($base_path, $config['themes']), '/');

  if(is_dir($directory))
  {
    foreach(preg_grep('~\.css$~', scandir($directory, SCANDIR_SORT_NONE)) as $theme)
    {
      if($theme[0] != '.') array_push($themes, substr($theme, 0, strrpos($theme, '.')));
    }
  }

  if(count($themes) > 0) array_unshift($themes, 'default');
}

$current_theme = count($themes) > 0 && is_array($client) && isset($client['theme']) ? (in_array($client['theme'], $themes) ? $client['theme'] : NULL) : NULL;
?>
<!DOCTYPE HTML>
<html lang="en">
  <head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title><?=sprintf($config['format']['title'], $indexer->getCurrentDirectory());?></title>
    <link rel="shortcut icon" href="<?=$config['icon']['path'];?>" type="<?=$config['icon']['mime'];?>">

    <link rel="stylesheet" type="text/css" href="/indexer/css/style.css">
    <?=$current_theme ? '<link rel="stylesheet" type="text/css" href="' . $config['themes'] . $current_theme . '.css">' . PHP_EOL : ''?>

  </head>

  <body class="directory">

    <div class="top-bar">
        <div class="extend ns">&#x25BE;</div>
        <div class="directory-info">
          <div data-count="size"><?=$data['size']['readable'];?></div>
          <div <?=$data['recent']['file'] !== 0 ? 'title="Newest: ' . $data['recent']['file'] . '" ' : '';?>data-count="files"><?=$counts['files'] . ($counts['files'] === 1 ? ' file' : ' files');?></div>
          <div <?=$data['recent']['directory'] !== 0 ? 'title="Newest: ' . $data['recent']['directory'] . '" ' : '';?>data-count="directories"><?=$counts['directories'] . ($counts['directories'] === 1 ? ' directory' : ' directories');?></div>
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

<div class="bottom">

<?=($config['footer'] === true) ? sprintf(
    '  <div>Page generated in %f seconds</div><div>Browsing <span>%s</span> @ <a href="/">%s</a></div>',
    (microtime(true) - $render), $indexer->getCurrentDirectory(), $_SERVER['SERVER_NAME']
) : '';?>

</div>

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

<script type="text/javascript" src="/indexer/js/vendors.js"></script>
<script type="text/javascript" src="/indexer/js/gallery.js"></script>
<script type="text/javascript" src="/indexer/js/preview.js"></script>

<script type="text/javascript"><?=('var config = ' . json_encode(array(
  'preview' => array(
    'enabled' => $config['preview']['enabled'],
    'hover_delay' => $config['preview']['hover_delay'],
    'window_margin' => $config['preview']['window_margin'],
    'cursor_indicator' => $config['preview']['cursor_indicator'],
    'static' => $config['preview']['static']
  ),
  'sorting' => array(
    'enabled' => $sorting['enabled'],
    'types' => $sorting['types'],
    'sort_by' => strtolower($sorting['sort_by']),
    'order' => $sorting['order'] === SORT_ASC ? 'asc' : 'desc'
  ),
  'gallery' => array(
    'enabled' => $config['gallery']['enabled'],
    'reverse_options' => $config['gallery']['reverse_options'],
    'fade' => $config['gallery']['fade'],
    'scroll_interval' => $config['gallery']['scroll_interval'],
    'list_alignment' => $config['gallery']['list_alignment']
  ),
  'extensions' => array(
    'image' => $config['extensions']['image'],
    'video' => $config['extensions']['video']
  ),
  'themes' => array(
    'path' => $config['themes'],
    'pool' => $themes,
    'set' => $current_theme ? $current_theme : 'default'
  ),
  'format' => array_intersect_key($config['format'], array_flip(array('sizes'))),
  'timestamp' => $indexer->timestamp,
  'debug' => $config['debug'],
  'mobile' => false
)) . ';'); ?>
config.mobile = Modernizr.mq('(max-width: 640px)');</script>

<script type="text/javascript" src="/indexer/js/main.js"></script>
</body>
</html>