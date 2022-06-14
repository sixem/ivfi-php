<?php
if($data['readme'] && file_exists($data['readme']))
{
    $readmeSupport = array(
        'parsedown' => new Parsedown(),
        'contents' => file_get_contents($data['readme'])
    );

    echo sprintf(
        '<div class="readme-container"><div class="readme-inner">%s</div></div>',
        $readmeSupport['parsedown']->text($readmeSupport['contents'])
    );
}
?>