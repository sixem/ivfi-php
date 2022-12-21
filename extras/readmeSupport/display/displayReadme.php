<?php
if($data['readme'] && file_exists($data['readme']))
{
    $readmeSupport = array(
        'parsedown' => new Parsedown(),
        'contents' => file_get_contents($data['readme'])
    );

    echo sprintf(
        '<details class="readmeContainer"%s>                        
    <summary>README.md</summary>
    <div class="contents">%s</div>    
  </details>',
(isset($cookies['readme']['toggled']) && $cookies['readme']['toggled'] === true) ? ' open=""' : '',
$readmeSupport['parsedown']->text($readmeSupport['contents'])
    );
}
?>