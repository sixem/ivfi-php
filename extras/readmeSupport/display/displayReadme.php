<?php
$readmeHtml = (static function ($path) {
    if(!$path || !extension_loaded('mbstring') || !is_file($path)) return null;

    $stream = @fopen($path, 'rb');
    if($stream === false) return null;
    try {
        /* Bound both the initial file size and reads if the file grows. */
        $limit = 1024 * 1024;
        $stat = fstat($stream);
        if($stat === false || ($stat['mode'] & 0170000) !== 0100000 || $stat['size'] > $limit) return null;
        $contents = @stream_get_contents($stream, $limit + 1);
        if($contents === false || strlen($contents) > $limit) return null;
    } finally {
        fclose($stream);
    }

    return (new Parsedown())->setSafeMode(true)->text($contents);
})($data['readme']);

if($readmeHtml !== null)
{
    echo sprintf(
        '<details class="readmeContainer"%s>
    <summary>README.md</summary>
    <div class="contents">%s</div>
  </details>',
        (isset($cookies['readme']['toggled']) && $cookies['readme']['toggled'] === true) ? ' open=""' : '',
        $readmeHtml
    );
}
?>