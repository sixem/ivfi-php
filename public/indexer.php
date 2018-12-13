<?php
require_once('../src/eyy-indexer.php');

$options = array(
  'IGNORED_FILES' => array('OmNx0-90ywg.jpg', 'indexer.php', 'index.php', '404.php')
);

if(!isset($_GET['dir']) || empty($_GET['dir'])) { $indexer = new indexer($options);} else { $indexer = new indexer($options, $_GET['dir']);}
?>
<!DOCTYPE HTML>
<html lang="en">
  <head>
    <title><?php echo $indexer->createTitle(); ?></title>

    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <script src="/js/jquery.min.js"></script>
    <script src="/js/scrollTo.min.js"></script>
    <script src="/js/tocca.min.js"></script>
    <script src="/js/indexer.beta.js"></script>

    <link rel="stylesheet" href="/css/indexer.css">
    <link rel="shortcut icon" href="/favicon.ico">
  </head>

  <body>
    <div class="content-main page-align-center">

      <?php echo $indexer->getIndex(); ?>

    </div>
  </body>
</html>