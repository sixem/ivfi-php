<?php
// These extensions will have a hoverable preview.
define('PREVIEW_EXSTENSIONS', array(
	'jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'bmp', 'mp4', 'webm'
));

// These files will not be shown.
define('IGNORED_FILENAMES', array(
	'index.php', 'indexer.php'
));

// These directory names will not be shown.
define('IGNORED_DIRECTORIES', array());

// Files with these extensions will not be shown.
define('IGNORED_EXSTENSIONS', array());

// Directories that should be inaccessible.
define('DISABLED_DIRECTORIES', array());

// Links that will be appear at the top of the page.
define('LINKS', array(
	'Home' => '/'
));

// Whether to show a version label at the bottom of the page or not.
define('SHOW_VERSION', false);

// Whether to show a wget command at the bottom of the page or not.
define('SHOW_WGET', true);
?>