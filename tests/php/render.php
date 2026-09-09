<?php
// Run the complete generated page in its own request/process.
$request = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
$_SERVER = [
    'REQUEST_URI' => $request['uri'],
    'REQUEST_METHOD' => 'GET',
    'SERVER_PROTOCOL' => 'HTTP/1.1',
    'SERVER_NAME' => 'localhost',
    'INDEXER_BASE_PATH' => getcwd(),
    'HTTP_X_INDEXER_PREPEND_PATH' => $request['prepend'],
];
$_COOKIE = [];
$_GET = [];
$_POST = [];
require $argv[1];
