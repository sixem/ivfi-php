<?php
// Run the complete generated page in its own request/process.
$request = json_decode(stream_get_contents(STDIN), true, 512, JSON_THROW_ON_ERROR);
if(!empty($request['captureResponse'])) {
    ob_start();
    register_shutdown_function(function () {
        $body = ob_get_clean();
        echo json_encode([
            'status' => http_response_code() ?: 200,
            'body' => $body,
            'displayErrors' => ini_get('display_errors'),
        ], JSON_THROW_ON_ERROR);
    });
}
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
