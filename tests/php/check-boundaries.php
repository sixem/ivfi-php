<?php
// Load the real generated page, discard its HTML, then exercise its helper.
ob_start();
require __DIR__ . '/render.php';
ob_end_clean();

$results = [];
foreach($request['cases'] as $name => $case) {
    $results[$name] = Helpers::isAboveCurrent($case[0], $case[1], $case[2]);
}
echo json_encode($results, JSON_THROW_ON_ERROR);
