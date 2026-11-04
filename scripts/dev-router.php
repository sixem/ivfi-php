<?php
/** Local development router. Byte ranges are required for native audio/video seeking. */
// Normalize filesystem separators so the same router works with Windows PHP.
$canonical = static fn($path) => ($resolved = realpath($path)) === false ? false : str_replace('\\', '/', $resolved);
$media = $canonical($_SERVER['DOCUMENT_ROOT']);
$build = $canonical(getenv('IVFI_DEV_BUILD_DIR') ?: dirname(__DIR__) . '/build');
if ($media === false || $build === false || !is_file($build . '/indexer.php')) {
    http_response_code(503);
    echo 'Build IVFi before starting the PHP server.';
    return true;
}
$within = static fn($file, $root) => $file === $root || str_starts_with($file, rtrim($root, '/') . '/');
$path = rawurldecode(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/');
foreach (explode('/', $path) as $part) {
    if ($part === '.' || $part === '..' || str_contains($part, "\0") || str_contains($part, "\\") || ($part !== '' && $part[0] === '.')) {
        http_response_code(404);
        return true;
    }
}
if (preg_match('/\.(?:php[0-9]*|phtml|phar)(?:\/|$)/i', $path)) {
    http_response_code(404);
    return true;
}
// Built assets take precedence over an older indexer installation in the files directory.
$file = $canonical($build . $path);
$buildAsset = $file !== false && is_file($file) && $within($file, $build);
if (!$buildAsset) {
    $file = $canonical($media . $path);
    if ($file !== false && !$within($file, $media)) {
        http_response_code(404);
        return true;
    }
}
if ($file !== false && is_file($file)) {
    $types = [
        'mp3' => 'audio/mpeg', 'wav' => 'audio/wav', 'flac' => 'audio/flac',
        'm4a' => 'audio/mp4', 'aac' => 'audio/aac', 'ogg' => 'application/ogg',
        'oga' => 'audio/ogg', 'opus' => 'audio/ogg', 'mp4' => 'video/mp4',
        'webm' => 'video/webm', 'ogv' => 'video/ogg', 'mov' => 'video/quicktime',
    ];
    $type = $types[strtolower(pathinfo($file, PATHINFO_EXTENSION))] ?? null;
    if ($type === null && !$buildAsset) return false;
    $type ??= match (strtolower(pathinfo($file, PATHINFO_EXTENSION))) {
        'css' => 'text/css', 'js' => 'text/javascript', 'woff2' => 'font/woff2',
        'map', 'json' => 'application/json',
        default => function_exists('mime_content_type') ? (mime_content_type($file) ?: 'application/octet-stream') : 'application/octet-stream',
    };
    if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'HEAD'], true)) {
        http_response_code(405);
        header('Allow: GET, HEAD');
        return true;
    }
    $stream = fopen($file, 'rb');
    if ($stream === false) {
        http_response_code(404);
        return true;
    }
    $stat = fstat($stream);
    $size = $stat['size'];
    $start = 0;
    $end = $size - 1;
    $etag = '"' . dechex($stat['mtime']) . '-' . dechex($size) . '"';
    header('Content-Type: ' . $type);
    header('Accept-Ranges: bytes');
    header('ETag: ' . $etag);
    header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $stat['mtime']) . ' GMT');
    $range = $_SERVER['HTTP_RANGE'] ?? '';
    $ifRange = $_SERVER['HTTP_IF_RANGE'] ?? null;
    if ($ifRange !== null && $ifRange !== $etag && (strtotime($ifRange) ?: 0) < $stat['mtime']) $range = '';
    // Unsupported/malformed range syntax is ignored; unsatisfiable single ranges return 416.
    if ($_SERVER['REQUEST_METHOD'] === 'GET' && preg_match('/^bytes=(\d*)-(\d*)$/D', $range, $match)
        && ($match[1] !== '' || $match[2] !== '')) {
        if ($match[1] === '') {
            $suffix = (int) $match[2];
            $start = $suffix > 0 ? max(0, $size - $suffix) : $size;
        } else {
            $start = (int) $match[1];
            if ($match[2] !== '') $end = min($end, (int) $match[2]);
        }
        if ($start >= $size || $start > $end) {
            http_response_code(416);
            header('Content-Range: bytes */' . $size);
            header('Content-Length: 0');
            fclose($stream);
            return true;
        }
        http_response_code(206);
        header("Content-Range: bytes $start-$end/$size");
    }
    $remaining = max(0, $end - $start + 1);
    header('Content-Length: ' . $remaining);
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        fseek($stream, $start);
        while ($remaining > 0 && !feof($stream) && !connection_aborted()) {
            $chunk = fread($stream, min(65536, $remaining));
            if ($chunk === false || $chunk === '') break;
            echo $chunk;
            $remaining -= strlen($chunk);
            flush();
        }
    }
    fclose($stream);
    return true;
}
// The Node dev server injects its reload client only into generated listings.
if (getenv('IVFI_DEV_BUILD_DIR')) header('X-IVFi-Dev-Page: 1');
$_SERVER['INDEXER_BASE_PATH'] = $media;
require $build . '/indexer.php';
