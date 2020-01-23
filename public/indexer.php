<?php

/**
 * <eyy-indexer> [https://github.com/sixem/eyy-indexer]
 *
 * @license  https://github.com/sixem/eyy-indexer/blob/master/LICENSE GPL-3.0
 * @author   emy <admin@eyy.co>
 * @version  1.1.1
 */

$config = array(
    'format' => array(
        'title' => 'Index of %s',
        'sizes' => array(' B', ' kB', ' MB', ' GB', ' TB')
    ), 
    'gallery' => array(
        'enabled' => true,
        'fade' => 0,
        'reverse_options' => true,
        'scroll_interval' => 50
    ),
    'preview' => array(
        'enabled' => true,
        'static' => false,
        'hover_delay' => 75,
        'window_margin' => 0,
        'cursor_indicator' => true
    ),
    'extensions' => array(
        'image' => array(
            'jpg',
            'jpeg',
            'gif',
            'png',
            'ico',
            'svg',
            'bmp'
        ),
        'video' => array(
            'webm',
            'mp4'
        )
    ),
    'allow_direct_access' => false,
    'footer' => true,
    'debug' => false
);

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

    $this->allow_direct = isset($options['allow_direct_access']) ? $options['allow_direct_access'] : true;

    $this->path = rtrim(self::joinPaths($this->relative, $requested), '/');

    if(is_dir($this->path))
    {
      if(self::isAboveCurrent($this->path, $this->relative))
      {
        $this->requested = $requested;
      } else {
        throw new Exception('requested path is below the public working directory.');
      }
    } else {
      if(is_file($this->path))
      {
        if($this->allow_direct === false)
        {
          http_response_code(403); die('Forbidden');
        }

        $this->path = dirname($this->path);

        if(self::isAboveCurrent($this->path, $this->relative))
        {
          $this->requested = dirname($requested);
        } else {
          throw new Exception('requested path (is_file) is below the public working directory.');
        }
      } else {
        throw new Exception('invalid path. path does not exist.');
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

    if(isset($options['format']['sizes']) && $options['format']['sizes'] !== NULL)
    {
      $this->sizes = $options['format']['sizes'];
    } else {
      $this->sizes = array(' B', ' kB', ' MB', ' GB', ' TB', ' PB', ' EB', ' ZB', ' YB');
    }
  }

  public function buildTable()
  {
    $op = sprintf(
      '<tr class="parent"><td><a href="%s">[Parent Directory]</a></td><td>-</td><td>-</td><td>-</td></tr>',
      dirname(self::getCurrentDirectory())
    );

    $files = self::getFiles();

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
        array_push($data['directories'], array($path, $file)); continue;
      } else if(file_exists($path))
      {
        array_push($data['files'], array($path, $file)); continue;
      }
    }

    foreach($data['directories'] as $dir)
    {
      $attr = array(
        'modified' => self::getModified($dir[0])
      );

      $op .= sprintf(
        '<tr class="directory"><td data-raw="%s"><a href="%s">[%s]</a></td><td>%s</td><td>-</td><td>-</td></tr>',
        $dir[1], rtrim(self::joinPaths($this->requested, $dir[1]), '/'), $dir[1], $attr['modified'][1]
      );

      if($data['recent']['directory'] === 0 || $attr['modified'][0] > $data['recent']['directory'])
      {
        $data['recent']['directory'] = $attr['modified'][0];
      }
    }

    foreach($data['files'] as $file)
    {
      $attr = array(
        'filetype' => self::getFileType($file[1]),
        'size' => self::getSize($file[0]),
        'modified' => self::getModified($file[0]),
        'path' => rtrim(self::joinPaths($this->requested, $file[1]), '/')
      );

      $data['size']['total'] = ($data['size']['total'] + $attr['size'][0]);

      if($data['recent']['file'] === 0 || $attr['modified'][0] > $data['recent']['file'])
      {
        $data['recent']['file'] = $attr['modified'][0];
      }

      $op .= sprintf(
        '<tr class="file"><td data-raw="%s">',
        $file[1]
      );

      $op .= sprintf(
        '<a%shref="%s">%s</a></td>',
        (($attr['filetype'] === 'image' || $attr['filetype'] === 'video' ? true : false) ? ' class="preview" ' : ' '), $attr['path'], $file[1]
      );

      $op .= sprintf(
        '<td data-raw="%d">%s</td>',
        $attr['modified'][0], $attr['modified'][1]
      );

      $op .= sprintf(
        '<td data-raw="%d">%s</td>',
        $attr['size'][0] === -1 ? 0 : $attr['size'][0], $attr['size'][1]
      );

      $op .= sprintf(
        '<td data-raw="%s" class="download"><a href="%s" download="" filename="%s">%s</a></td></tr>',
        $attr['filetype'], $attr['path'], $file[1], ('<span data-view="mobile">[Save]</span><span data-view="desktop">[Download]</span>')
      );
    }

    $data['size']['readable'] = self::readableFilesize($data['size']['total']);

    foreach(array('file', 'directory') as $type)
    {
      if($data['recent'][$type] > 0)
      {
        $data['recent'][$type] = strftime('%d/%m/%y %H:%m', $data['recent'][$type]);
      }
    }

    $this->data = $data;

    return $op;
  }

  private function getFiles()
  {
    return scandir($this->path);
  }

  private function isAboveCurrent($path, $base)
  {
    return self::startsWith(realpath($path), realpath($base));
  }

  public function getLastData()
  {
    return isset($this->data) ? $this->data : false;
  }

  public function getCurrentDirectory()
  {
    return ($this->requested === '/' || $this->requested === '\\') ? $this->requested : rtrim($this->requested, '/');
  }

  private function getFileType($filename)
  {
    $extension = ltrim(pathinfo($filename, PATHINFO_EXTENSION), '.');

    return isset($this->types[$extension]) ? $this->types[$extension] : 'other';
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

  private function getModified($path)
  {
    $stamp = filemtime($path);

    return array($stamp, strftime('%d/%m/%y <span data-view="desktop">%H:%m</span>', $stamp));
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

    if($bytes > 104857600) $decimals = 0;

    $factor = floor((strlen($bytes) - 1) / 3);

    $x = @$this->sizes[$factor];

    if($x === $this->sizes[1]) $decimals = 0;

    return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . $x;
  }

  private function startsWith($haystack, $needle)
  {
    return $needle === '' || strrpos($haystack, $needle, - strlen($haystack)) !== false;
  }

  private function joinPaths(...$params)
  {
    $paths = array();

    foreach($params as $param)
    {
        if($param !== '') $paths[] = $param;
    }

    return preg_replace('#/+#','/', join('/', $paths));
  }
}

$indexer = new Indexer(
    urldecode($_SERVER['REQUEST_URI']),
    array(
        'path' => array(
            'relative' => dirname(__FILE__)
        ),
        'format' => array(
            'sizes' => isset($config['format']['sizes']) ? $config['format']['sizes'] : NULL
        ),
        'extensions' => $config['extensions'],
        'allow_direct_access' => $config['allow_direct_access']
    )
);

$contents = $indexer->buildTable();

$data = $indexer->getLastData();

$counts = array(
    'files' => count($data['files']),
    'directories' => count($data['directories'])
);
?>
<!DOCTYPE HTML>
<html lang="en">
  <head>
    <meta charset='utf-8'>
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title><?=sprintf($config['format']['title'], $indexer->getCurrentDirectory());?></title>
    <link rel="shortcut icon" href="/favicon.png" type="image/png">

    <link rel="stylesheet" type="text/css" href="/indexer/css/gallery.css">
    <link rel="stylesheet" type="text/css" href="/indexer/css/main.css">

  </head>

  <body class="directory">

    <div class="top-bar">
        <div class="extend ns">+</div>
        <div data-count="size"><?=$data['size']['readable'];?></div>
        <div <?=$data['recent']['file'] !== 0 ? 'title="Newest: ' . $data['recent']['file'] . '" ' : '';?>data-count="files"><?=$counts['files'] . ($counts['files'] === 1 ? ' file' : ' files');?></div>
        <div <?=$data['recent']['directory'] !== 0 ? 'title="Newest: ' . $data['recent']['directory'] . '" ' : '';?>data-count="directories"><?=$counts['directories'] . ($counts['directories'] === 1 ? ' directory' : ' directories');?></div>
    </div>

    <div class="path">Index of <?=$indexer->makePathClickable($indexer->getCurrentDirectory());?></div>

 <table>
  <thead>
    <tr>
      <th><span sortable="true" title="Sort by filename">Filename</span></th>
      <th><span sortable="true" title="Sort by modification date">Modified</span></th>
      <th><span sortable="true" title="Sort by filesize">Size</span></th>
      <th><span sortable="true" title="Sort by filetype">Options</span></th>
    </tr>
  </thead>

  <?=$contents;?>
</table>

<?=($config['footer'] === true) ? sprintf(
    '<div class="bottom">Page generated in %f seconds<div>Browsing %s @ <a href="/">%s</a></div></div>',
    (microtime(true) - $render), $indexer->getCurrentDirectory(), $_SERVER['SERVER_NAME']
) : '';?>

<div class="filter-container">
    <div>
        <input type="text" placeholder="Search .." value="">
        <div class="status"></div>
    </div>
    <div class="close">
        <span>[Close]</span>
    </div>
</div>

<!-- [https://github.com/sixem/eyy-indexer] --> 

<script type="text/javascript" src="/indexer/js/jquery.js"></script>
<script type="text/javascript" src="/indexer/js/modernizr-mq.js"></script>
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
  'gallery' => array(
    'enabled' => $config['gallery']['enabled'],
    'reverse_options' => $config['gallery']['reverse_options'],
    'fade' => $config['gallery']['fade'],
    'scroll_interval' => $config['gallery']['scroll_interval']
  ),
  'extensions' => array(
    'image' => $config['extensions']['image'],
    'video' => $config['extensions']['video']
  ),
  'debug' => $config['debug'],
  'mobile' => false
)) . ';'); ?>
config.mobile = Modernizr.mq('(max-width: 640px)');</script>

<script type="text/javascript" src="/indexer/js/main.js"></script>
</body>
</html>