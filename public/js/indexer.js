// indexer.js [https://github.com/sixem/eyy-indexer]

$variables = {
    'currentItem' : 0,
    'currentItemType' : undefined,
    'galleryIsBusy' : false,
    'galleryItems' : undefined,
    'galleryListShow' : undefined,
    'lastAdjusted' : undefined,
    'lastPreview' : undefined,
    'topbarHeight': 0,
    'scrollPosition' : undefined,
    'isMobile' : false
};

// Indexer settings.
// Can be set as key/value in local storage and it'll be loaded from there instead (These are default values)
$options = {
    'indexer.useXMLHttpRequest' : true, // Use XML requests when previewing images
    'indexer.videoPreview.volume' : 0, // Default video preview volume (Assuming no saved volume is stored)
    'indexer.videoPreview.adjustInterval' : 1.5, // Adjustment interval for video preview volume in percentage
    'gallery.hover.showImageOptions' : true, // Show reverse search options on images in gallery mode
    'gallery.scrollInterval' : 0 // Break inbetween gallery scroll navigation events (milliseconds)
};

function isMobileDevice()
{
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

function shortenString($input, $cutoff)
{
    $cutoff = $cutoff || 28;

    if($input.length > $cutoff)
    {
        return [
            $input.substr(0, ($cutoff / 2) - 1),
            $input.substr($input.length - (($cutoff / 2) - 1), $input.length)
        ].join(' .. ');

    } else {
        return $input;
    }
}

function getLocalStorageKey($key)
{
    $value = localStorage.getItem($key);

    if($value === null) { return null; }

    if($value == 'false' || $value == 'true')
    {
        return JSON.parse($value);
    } else {
        if($.isNumeric($value))
        {
            return parseInt($value);
        }
    }

    return $value;
}

function arrayContains(t, e)
{
    return $.inArray(t, e) > -1;
}

function elemPosition($elem)
{
    try {
        return ($($elem).offset().top - $(window).scrollTop()) / $(window).height();
    }
    catch(err)
    {
        return null;
    }
}

String.prototype.format = String.prototype.f = function()
{
    var s = this, i = arguments.length;

    while(i--)
    {
        s = s.replace(new RegExp('\\{' + i + '\\}', 'gm'), arguments[i]);
    }

    return s;
};

function isScrolledIntoView($elem, $offset)
{
    $offset = $offset || 0;

    $docViewTop = $(window).scrollTop();
    $docViewBottom = $docViewTop + $(window).height();

    $elemTop = $($elem).offset().top - $offset;
    $elemBottom = $elemTop + $($elem).height();

    return (($elemBottom <= $docViewBottom) && ($elemTop >= $docViewTop));
}

function getReverseImageSearchOptions($url)
{
    return {
        'Google': 'https://www.google.com/searchbyimage?image_url=' + encodeURIComponent($url) + '&safe=off',
        'Yandex': 'https://yandex.com/images/search?source=collections&&url=' + encodeURIComponent($url) + '&rpt=imageview',
        'IQDB': 'https://iqdb.org/?url=' + encodeURIComponent($url)
    };
}

function applySwipeEventListeners()
{
    if($variables['isMobile'] == true)
    {
        $container = $('.gallery-item-container');

        if($container.length > 0)
        {
            $container.on({
                'swipeleft' : function(e)
                {
                    galleryNavigate(1)
                },
                'swiperight' : function(e)
                {
                    galleryNavigate(-1)
                }
            });
        }
    }
}

function applyReverseSearchOptions($source)
{
    if($options['gallery.hover.showImageOptions'])
    {
        $reverseOptions = $.map(getReverseImageSearchOptions(document.location.origin + $source), function($url, $site)
        {
            return '<a target="_blank" href="' + $url + '">' + $site + '</a>';
        }).join('|');

        if($('#image-container > .tb-reverse-search-container').length == 0)
        {
            $('#image-container').prepend('<div class="tb-reverse-search-container"></div>');
        }

        $('#image-container > .tb-reverse-search-container').html($reverseOptions);
    }
}

function copyToClipboard($element)
{
    $temp = $('<input>'); $('body').append($temp);

    $temp.val($($element).text()).select();

    document.execCommand('copy'); $temp.remove();
}

function isEmpty(value)
{
    return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}

function disableMainScrolling($state)
{
    $main = $('.content-main');

    if($state)
    {
        $variables['scrollPosition'] = $(document).scrollTop();

        $('html, body').css({
            overflow: 'hidden',
            height: '100%'
        });

        $main.addClass('blur');

        $main.css({
            'overflow' : 'hidden',
            'margin-top' : '0px',
            'padding-right' : ($(window).innerWidth() - $(document).width()) + 'px'
        });
    } else {
        $('html, body').css({
            overflow: '',
            height: ''
        });

        $main.removeClass('blur');

        $main.css({
            'overflow' : '',
            'margin-top' : '8px',
            'padding-right' : ''
        });

        if($variables['scrollPosition'] != undefined && $variables['scrollPosition'] > 0)
        {
            $(document).scrollTop($variables['scrollPosition']);
        }
    }
}

function adjustGalleryItems()
{
    $variables['topbarHeight'] = $('.gallery-topbar').outerHeight();

    $list = $('#gallery-list');

    if($list.length > 0)
    {
        $list.css(
            {
                'height' : 'calc(100vh - ' + ($variables['topbarHeight'] + 2) + 'px)',
                'margin-top' : '0px'
            }
        );
    }

    $('#gallery-container').css({
        'margin-top' : $variables['topbarHeight'] + 'px',
        'height' : 'calc(100vh - ' + $variables['topbarHeight'] + 'px'
    });

    if($variables['isMobile'])
    {
        $navigationBars = $('.navigation-overlay-left, .navigation-overlay-right');

        $navigationBars.css({
            'margin-top' : $variables['topbarHeight'] + 'px',
            'height' : 'calc(100vh - ' + $variables['topbarHeight'] + 'px)'
        });
    }
}

function galleryLoading($state)
{
    $variables['galleryIsBusy'] = $state; $loader = $('#gallery-loader');

    if($state)
    {
        if($loader.length == 0)
        {
            if($variables['isMobile'])
            {
                $('body').append('<div id="gallery-loader">Loading ..</div>');

                $y = $('.navigation-overlay-left');

                if($y.length > 0)
                {
                    $('#gallery-loader').css('left', $y.innerWidth() + 'px');
                }
            } else {
                $('.tb-items > div').prepend('<span id="gallery-loader">[Loading ..]</span>');
            }
        }

        $('#gallery-loader').fadeIn(500);
    } else {
        $loader.stop();

        $loader.fadeOut(100, function()
        {
            $('#gallery-loader').remove(); adjustGalleryItems();
        });
    }
}

jQuery.expr.filters.offscreen = function($el)
{
  $rect = $el.getBoundingClientRect();
  return (
           ($rect.x + $rect.width) < 0
             || ($rect.y + $rect.height) < 0
             || ($rect.x > window.innerWidth || $rect.y > window.innerHeight)
         );
};

function galleryIsVisible()
{
    return $('#gallery-container').length > 0;
}

function galleryHandleKey($keycode)
{
    if(galleryIsVisible())
    {
        if($keycode === 27)
        {
            galleryClose();
        }
        if($keycode === 37)
        {
            galleryNavigate(-1);
        }
        if($keycode === 39)
        {
            galleryNavigate(1);
        }

        if($keycode === 38 || $keycode === 33)
        {
            galleryNavigate(-1);
        }

        if($keycode === 40 || $keycode === 34)
        {
            galleryNavigate(1);
        }
    }

}

function galleryClose()
{
    if($(document).has('#gallery-container'))
    {
        $('#gallery-container').remove();
    }

    if($(document).has('.gallery-topbar'))
    {
        $('.gallery-topbar').remove();
    }

    disableMainScrolling(false);
}

function isGalleryListVisible()
{
    return $('#gallery-list').is(':visible');
}

function doesGalleryListExist()
{
    return $('#gallery-list').length > 0;
}

function hideGalleryList()
{
    $listContainer = $('#gallery-list');

    if(isGalleryListVisible())
    {
        $listContainer.hide();

        $listToggleButton = $('#gallery-toggle-list');

        $listToggleButton.attr('onclick', 'showGalleryList();');
        $listToggleButton.text('[List+]');

        $variables['galleryListShow'] = false;
    }
}

function showGalleryList()
{
    $listToggleButton = $('#gallery-toggle-list');

    $variables['galleryListShow'] = true;

    if(doesGalleryListExist() && isGalleryListVisible() === false)
    {
        $list = $('#gallery-list'); $list.show();

        $listToggleButton.text('[List-]').attr('onclick', 'hideGalleryList();');

        $selectedItem = $list.find('.selected').first();

        if($selectedItem.length > 0 && !isScrolledIntoView($selectedItem, $selectedItem.height()))
        {
            $list.scrollTo($selectedItem);
        }

        return true;
    }

    if(galleryIsVisible() && doesGalleryListExist() === false)
    {
        $listToggleButton.text('[List-]');
        $listToggleButton.attr('onclick', 'hideGalleryList();');

        $table = '<table cellspacing="0"><tbody></tbody></table>';

        $container = $('#gallery-container');
        $container.find('.gallery-current-item').append('<div id="gallery-list">' + $table + '</div>');

        $('#indexer-files-table .item:visible').each(function()
        {
            if($(this).is(':hidden')) { return true; }

            $current = $(this).find('td').first();

            if($current.hasClass('preview'))
            {
                $('.gallery-current-item').find('#gallery-list > table').append('<tr>' +
                    '<td>' + $current.find('a').text() + '</td></tr>');
            }
        });

        setGalleryListSelected($variables['currentItem']);
    }

    adjustGalleryItems();
}

$(document).on('click', '#gallery-list > table > tbody > tr', function()
{
    galleryNavigate($(this).index(), true);
});

function setGalleryListSelected($index)
{
    $list = $('#gallery-list');

    $listItems = $list.find('table > tbody').find('tr > td');

    $current = $listItems.eq($index).first();

    if($current != undefined)
    {
        if(!isScrolledIntoView($current, $current.height()))
        {
            $list.scrollTo($current);
        }
    }

    $listItems.removeClass('selected'); $current.addClass('selected');
}

function waitForVideo($video, $pseudo)
{
    if($pseudo == undefined){ $pseudo = false; }

    function checkLoad()
    {
        if($video.prop('readyState') == 4 || $video.prop('readyState') == 3)
        {
            galleryLoading(false);

            $container = $('#video-container');

            if($.isNumeric($variables['topbarHeight']))
            {
                $video.css('max-height', 'calc(100vh - ' + $variables['topbarHeight'] + 'px');
            }

            if($pseudo == false)
            {
                $video.show(); $container.show();
            } else {
                $other = $container.find('video').not('.pseudo');
                $video.removeClass('pseudo');
                $video.show(); $other.remove();
            }

            $video.one('seeked', function(){}).prop('currentTime', 0);

            $('.gallery-item-container > #image-container').hide(); $container.show();
        } else {
            setTimeout(checkLoad, 100);
        }
    }

    checkLoad();
}

function createPseudoVideo($src)
{
    return '<video controls loop class="pseudo"><source src="' + $src + '"></video>';
}

function galleryLoadItem($source)
{
    $ext = $source.split('.').pop().toLowerCase();

    $videoContainer = $('.gallery-item-container #video-container');

    if($videoContainer.find('source').length > 0)
    {
        $videoContainer.find('video').get(0).pause();
    }

    if(arrayContains($ext, ['jpg','jpeg','gif','png','ico','svg','bmp']))
    {
        $variables['currentItemType'] = 1;

        if($('.gallery-item-container #image-container').length == 0)
        {
            $('.gallery-item-container').append('<div id="image-container"><img src=""></div>');
        }

        $img = new Image();

        $($img).on('load', function()
        {
            $img_el = $('.gallery-item-container > #image-container > img');

            $img_el.attr('src', $img.src);

            if($.isNumeric($variables['topbarHeight']))
            {
                $img_el.css('max-height', 'calc(100vh - ' + $variables['topbarHeight'] + 'px');
            }

            galleryLoading(false);

            $('.gallery-item-container > #image-container').show();

            $videoContainer.hide();
        });

        $img.src = $source;
    }

    if(arrayContains($ext, ['mp4','webm']))
    {
        $variables['currentItemType'] = 2;

        if($videoContainer.length == 0)
        {
            $('.gallery-item-container').append('<div id="video-container"><video controls loop><source src=""></video></div>');

            $video = $('#video-container video');
            $video.find('source').attr('src', $source);
            $video.load();

            waitForVideo($video, false);
        } else {
            $container = $('#video-container');

            $container.find('.pseudo').remove();

            $container.append(createPseudoVideo($source));

            $video = $container.find('.pseudo');
            $video.load();

            waitForVideo($video, true);
        }
    }

    applyReverseSearchOptions($source); adjustGalleryItems();
}

function getItemData($item)
{
    if($variables['isMobile'])
    {
        $filename = shortenString($item.attr('data-raw'));
    } else {
        $filename = $item.attr('data-raw');
    }

    $parent = $item.parent();

    return {
        'filename' : $filename,
        'filenameFull' : $item.attr('data-raw'),
        'filesize' : $parent.find('td').eq(2).html(),
        'modified' : $parent.find('td').eq(1).html(),
        'url' : $item.find('a').attr('href'),
        'ext' : $item.attr('data-raw').split('.').pop().toLowerCase()
    };
}

function setCurrentItem($i, $direct)
{
    $direct = $direct || false;

    if($direct == false)
    {
        if($i == 1)
        {
            if(($variables['currentItem'] + $i) > ($variables['galleryItems'].length - 1))
            {
                $variables['currentItem'] = 0;
            } else {
                $variables['currentItem'] = ($variables['currentItem'] + $i);
            }
        }

        if($i < 0)
        {
            if(($variables['currentItem'] + $i) < 0)
            {
                $variables['currentItem'] = ($variables['galleryItems'].length - 1);
            } else {
                $variables['currentItem'] = ($variables['currentItem'] + $i);
            }
        }
    } else {
        if($variables['currentItem'] == $i)
        {
            return false;
        } else {
            $variables['currentItem'] = $i;
        }
    }
}

function updateTbFileInfo($item)
{
    $counter = '<span class="tb-counter">{0} of {1}</span> | '.f(($variables['currentItem'] + 1), $variables['galleryItems'].length);

    $data = '<a target="_blank" href="{0}" class="tb-filename" data-filename-full="{1}" data-last-modified="{2}">{3}</a> | '+
    '<span class="tb-filesize">{4}</span>';

    $download = $('.tb-download');

    if($download.length > 0)
    {
        $download.attr({
            'filename' : $item['filenameFull'],
            'href' : $item['url']
        });
    }

    $('.tb-current-item').html($counter + $data.f(
        $item['url'],
        $item['filenameFull'],
        $item['modified'],
        $item['filename'],
        $item['filesize']
    ));
}

function galleryNavigate($i, $direct)
{
    $direct = $direct || false; if($variables['galleryIsBusy'] == true) { return false; }

    if($i !== 0 && $direct !== true)
    {
        if($variables['galleryItems'].length <= 1)
        {
            return false;
        }
    }

    setCurrentItem($i, $direct);

    showGalleryOverlay($variables['currentItem'], undefined, true);

    if(doesGalleryListExist())
    {
        setGalleryListSelected($variables['currentItem']);
    }

    galleryLoading(true);

    if($('#gallery-container .gallery-item-container').length > 0)
    {
        updateTbFileInfo(getItemData($variables['galleryItems'].eq($variables['currentItem'])));
    }

    galleryLoadItem($variables['galleryItems'].eq($variables['currentItem']).attr('data-thumb'));
}

$shiftKey = false;

$(document).keydown(function(e)
{
    $shiftKey = e.shiftKey;

    if(e.keyCode == 27)
    {
        $searchFilter = $('#search-filter');

        if($searchFilter.is(':visible') && $searchFilter.find('input').is(':focus'))
        {
            toggleFilter();
        }
    }

    if(e.keyCode == 70 && $shiftKey == true)
    {
        $searchFilter = $('#search-filter');

        if($searchFilter.is(':visible') && $searchFilter.find('input').is(':focus'))
        {
            return true;
        }

        e.preventDefault(); e.stopPropagation(); toggleFilter();
    }

    if(e.keyCode == 38 || e.keyCode == 40)
    {
        if(isGalleryListVisible())
        {
            e.preventDefault();
            e.stopPropagation();
        }
    }
});

$(document).keyup(function(e)
{
    $shiftKey = e.shiftKey;

    if(galleryIsVisible())
    {
        galleryHandleKey(e.keyCode);
    }
});

$(document).on('click', '#gallery-container',function(e)
{
    if($(e.target).is('#gallery-container, .gallery-current-item, .tb-reverse-search-container, .gallery-item-container, #image-container') || $(e.target).hasClass('gallery-item-container'))
    {
        galleryClose();
    }
});

$(document).on('mouseenter', '#image-container, #video-container',function(e)
{
    if($options['gallery.hover.showImageOptions'])
    {
        $('.tb-reverse-search-container').stop(); $('.tb-reverse-search-container').fadeIn(88);
    }
});

$(document).on('mouseleave', '#image-container, #video-container',function(e)
{
    if($options['gallery.hover.showImageOptions'])
    {
        $('.tb-reverse-search-container').stop(); $('.tb-reverse-search-container').fadeOut(88);
    }
});

window.onmouseover=function(e)
{
    if($('#thumbnail-container').is(':visible'))
    {
        if($(e.target).parent().hasClass('preview'))
        {
            if($(e.target).hasClass('preview'))
            {
                hideThumbnail();
            }
        }
    }
};

$(document).on('click', '#view-gallery', function()
{
    if($('#indexer-files-table .item:visible .preview').length === 0)
    {
        return false;
    }

    if($('#gallery-container').length === 0)
    {
        $('body').prepend('<div id="gallery-container"></div>');
        disableMainScrolling(true);
    }

    $variables['galleryItems'] = $('#indexer-files-table .item:visible .preview'); galleryNavigate(0);
});

$(document).on('click', '.copy.wget', function()
{
    copyToClipboard('.bottom > .command.wget');

    $fadeTime = 150;

    $(this).fadeOut($fadeTime);

    $(this).promise().done(function()
    {
        $(this).css('color', '#32c232');
        $(this).text('[Copied to clipboard!]');
        $(this).fadeIn($fadeTime);
    });

    setTimeout(function ()
    {
        $thisElement = $('.copy.wget');

        $thisElement.fadeOut($fadeTime);

        $thisElement.promise().done(function()
        {
            $thisElement.css('color', $('.bottom').css('color'));
            $thisElement.text('[Copy to clipboard]');
            $thisElement.fadeIn($fadeTime);
        });
    }, 5000);
});

$(document).on('click', '#wget', function()
{
    if($('.bottom > .command').length)
    {
        $('.bottom > .command.wget, .bottom > .command-bottom').toggle();

        if($('.bottom > .command.wget').css('display') == 'none')
        {
            $(this).text('[+wget]');
        } else {
            $(this).text('[-wget]');
            $('html, body').animate(
                { scrollTop: $(document).height() }
                , 1000
            );
        }
    }
});

$(document).on('click', '.tb-right > .gallery-prev', function(e)
{
    galleryNavigate(-1);
});

$(document).on('click', '.tb-right > .gallery-next', function(e)
{
    galleryNavigate(1);
});

function getElementPositions($trigger)
{
    return {
        'top' : $trigger.position()['top'],
        'left' : $trigger.position()['left'],
        'width' : $trigger.find('a').width(),
        'offset' : $trigger.offset()
    };
}

function createThumbnailContainer()
{
    $('body').prepend('<div id="thumbnail-container"></div>');

    return $('#thumbnail-container');
}

$isVideoPreviewPlaying = false; $videoPreview = undefined; $videoPreviewVolumeChanged = false;

function videoHasAudio($video)
{
    if($video.prop('mozHasAudio') !== undefined)
    {
        if($video.prop('mozHasAudio') === true)
        {
            return true;
        }
    }

    if($video.prop('webkitAudioDecodedByteCount') !== undefined)
    {
        if($video.prop('webkitAudioDecodedByteCount') > 0)
        {
            return true;
        }
    }

    return false;
}

function adjustThumbnail($container)
{
    $container = $('#thumbnail-container');

    $child = $container.children().first();

    if($child.is('img'))
    {
        $src = $child.attr('src');
    } else {
        if($child.is('video'))
        {
            $src = $child.find('source').attr('src');

            $child.get(0).play(); // Fixes chrome autoplay issue

            if(videoHasAudio($child))
            {
                $isVideoPreviewPlaying = true; $videoPreview = $child;
            } else {
                $isVideoPreviewPlaying = false; $videoPreview = undefined;
            }
        } else {
            $src = undefined;
        }
    }

    if($variables['lastAdjusted'] != $src)
    {
        $container.show();

        $mediaContainer = $container.find('img, video');

        $mediaContainer.css('max-width', (($(window).width() - $container.position()['left']) - 25)+'px');

        $y = ($container.outerHeight() / 100) * (($mediaContainer.attr('data-offset') - $(window).scrollTop()) / $(window).height()) * 100;

        $container.css('top', $container.css('top').replace(/[^-\d\.]/g, '') - $y);

        $variables['lastAdjusted'] = $src;

    }

    $child.css('visibility', 'visible');

    $container.css({
        'max-height' : '100vh',
        'max-width' : '100vw'
    });
}

$thumbnailIsLoading = false;

function getCurrentVolume()
{
    // oncanplay event triggers on every loop so this function gets the live volume instead of a static set volume
    return $options['indexer.videoPreview.volume'] / 100;
}

function showThumbnail($trigger)
{
    $item = getItemData($trigger); $thumbnailIsLoading = true;

    $variables['lastPreview'] = $item['filenameFull'];

    $container = $('#thumbnail-container');

    if($('#thumbnail-container').length == 0)
    {
        $container = createThumbnailContainer();
    }

    $container.html('');

    $x = getElementPositions($trigger);

    $container.css({
        'left' : ($x['left'] + $x['width'] + 15), 'top' : $x['top']
    });

    if(arrayContains($item['ext'], ['jpg','jpeg','gif','png','ico','svg','bmp']))
    {
        if($options['indexer.useXMLHttpRequest'])
        {
            loadPreviewImage($item['url'], Math.round($x['top']), $container);
        } else {
            $container.append('<img src="{0}" onload="adjustThumbnail();" data-offset="{1}">'.f($item['url'], Math.round($x['top'])));
        }
    } else {
        if(arrayContains($item['ext'], ['mp4','webm']))
        {
            $v = '<video loop autoplay oncanplay="adjustThumbnail(); this.volume=getCurrentVolume();" data-offset="'+Math.round($x['top'])+'"><source src="'+$item['url']+'"></video>';

            $container.append($v);
        }
    }
}

function hideThumbnail()
{
    $container = $('#thumbnail-container');

    $container.html(''); $container.hide(); $variables['lastAdjusted'] = undefined;

    if($isVideoPreviewPlaying)
    {
        $isVideoPreviewPlaying = false; $videoPreview = undefined;

        if($videoPreviewVolumeChanged)
        {
            setOptions('indexer.videoPreview.volume', $options['indexer.videoPreview.volume']);
            $videoPreviewVolumeChanged = false;
        }
    }
}

function showGalleryOverlay($start, $showList, $navigate)
{
    hideThumbnail();

    if($thumbnailIsLoading === true)
    {
        hideProgressBar(250); $thumbnailIsLoading = false;
    }

    if($showList == undefined && $variables['galleryListShow'] != undefined)
    {
        $showList = $variables['galleryListShow'];
    }

    $start = $start || 0; $showList = $showList || false; $navigate = $navigate || false;

    $variables['galleryItems'] = $('#indexer-files-table .item:visible .preview');;

    if(!$.isNumeric($start))
    {
        if($start.is('td'))
        {
            $start = $variables['galleryItems'].index($start);
        }
    }

    setCurrentItem($start, true);

    if($('body > #gallery-container').length == 0)
    {
        $('body').prepend('<div id="gallery-container"></div>');

        disableMainScrolling(true);
    }

    if($('#gallery-container > .gallery-current-item').length == 0)
    {
        $('#gallery-container').html('<div class="gallery-current-item"></div>');
    }

    $item = getItemData($variables['galleryItems'].eq($variables['currentItem']));

    if($('#gallery-container .gallery-item-container').length == 0)
    {
        $np = '<span class="tb-current-item"></span><div class="tb-right">'+
        '<a class="tb-download" href="{0}" download="" filename="{1}">[Download]</a>'.f($item['url'], $item['filename'])+
        '<span class="gallery-prev">[Previous]</span><span class="gallery-next">[Next]</span>'+
        '<span id="gallery-toggle-list" onclick="showGalleryList();">[List+]</span><span onclick="galleryClose();">[Close]</span></div>';

        $('.gallery-current-item').html('<div class="gallery-item-container"></div>');

        $('#gallery-container').append('<div class="gallery-topbar"><div class="tb-items"></div></div>');

        $('.gallery-topbar > .tb-items').append($np); $('.gallery-topbar > .tb-items').prepend(updateTbFileInfo($item));

        if($variables['isMobile'] && $variables['galleryItems'].length > 1)
        {
            $('#gallery-container').append('<div class="navigation-overlay-left">&#x3C;</div>'+
                '<div class="navigation-overlay-right">&#x3E;</div>');
        }

        applySwipeEventListeners();

        if($timer !== undefined) { clearTimeout($timer); hideThumbnail(); };
    }

    if($navigate != true)
    {
        galleryLoadItem($variables['galleryItems'].eq($variables['currentItem']).attr('data-thumb'));
    }

    if($showList)
    {
        showGalleryList();
    }
}

$(document).on('click', '.preview > a', function(e)
{
    if($variables['isMobile'])
    {
        showGalleryOverlay($(this).parent(), false);
    } else {
        showGalleryOverlay($(this).parent(), true);
    }

    e.preventDefault();
});

$(document).on('input', '#search-filter input', function()
{
  filerTable($(this).val(), $(this));
});

$(document).on('click', '.navigation-overlay-left', function(e)
{
    galleryNavigate(-1); e.preventDefault();
});

$(document).on('click', '.navigation-overlay-right', function(e)
{
    galleryNavigate(1); e.preventDefault();
});

$timer = undefined;

$(document).on('mouseenter', '.preview > a', function()
{
    $item = $(this).parent();

    $timer = setTimeout(function() { showThumbnail($item); }, 250);
});

$(document).on('mouseleave', '.preview > a', function()
{
    clearTimeout($timer); hideThumbnail();

    if($thumbnailIsLoading === true)
    {
        hideProgressBar(250); $thumbnailIsLoading = false;
    }
});

$scrollBreak = false;

function scrollEventBreak()
{
    $scrollBreak = false;
}

$(document).on('DOMMouseScroll mousewheel', '.preview a', function(e)
{
    if($isVideoPreviewPlaying)
    {
        e.preventDefault(); $currentVolume = $options['indexer.videoPreview.volume'];

        if(e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0)
        {
            $currentVolume = ($currentVolume - $options['indexer.videoPreview.adjustInterval']);
        } else {
            $currentVolume = ($currentVolume + $options['indexer.videoPreview.adjustInterval']);
        }

        $currentVolume = ($currentVolume > 100 ? 100 : $currentVolume);
        $currentVolume = ($currentVolume < 0 ? 0 : $currentVolume);

        if($currentVolume <= 100 && $currentVolume >= 0)
        {
            $options['indexer.videoPreview.volume'] = $currentVolume;

            if($videoPreview !== undefined)
            {
                $videoPreviewVolumeChanged = true;
                $videoPreview.prop('volume', ($options['indexer.videoPreview.volume'] / 100));
            }
        }
    }
});

$(document).on('DOMMouseScroll mousewheel', '.gallery-item-container', function(e)
{
    if(e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0)
    {
        if($scrollBreak === false)
        {
            galleryNavigate(1);

            if($options['gallery.scrollInterval'] > 0)
            {
                $scrollBreak = true; setTimeout(scrollEventBreak, $options['gallery.scrollInterval']);
            }
        }
    } else {
        if($scrollBreak === false)
        {
            galleryNavigate(-1);

            if($options['gallery.scrollInterval'] > 0)
            {
                $scrollBreak = true; setTimeout(scrollEventBreak, $options['gallery.scrollInterval']);
            }
        }
    }

    return false;
});

function loadImage($imageUrl, onprogress)
{
  return new Promise(($resolve, $reject) =>
  {
    $xhr = new XMLHttpRequest();
    $notifiedNotComputable = false;

    $xhr.open('GET', $imageUrl, true);
    $xhr.responseType = 'arraybuffer';

    $xhr.onprogress = function($ev)
    {
      if ($ev.lengthComputable) {
        onprogress(parseInt(($ev.loaded / $ev.total) * 100));
      } else {
        if (!$notifiedNotComputable) {
          $notifiedNotComputable = true;
          onprogress(-1);
        }
      }
    }

    $xhr.onloadend = function() {
      if(!$xhr.status.toString().match(/^2/))
      {
        $reject($xhr);
      } else {
        if(!$notifiedNotComputable)
        {
          onprogress(100);
        }

        $opts = {};

        $mime = $xhr.getAllResponseHeaders().match(/^Content-Type\:\s*(.*?)$/mi);

        if($mime && $mime[1])
        {
          $opts.type = $mime[1];
        }

        $blob = new Blob([this.response], $opts);

        $resolve(window.URL.createObjectURL($blob));
      }
    }

    $xhr.send();
  });
}

function showProgressBar()
{
    $progress = $('#progress-bar');

    if($progress.length > 0)
    {
        $progress.attr('value', 0);
    } else {
        $('body').prepend('<progress id="progress-bar" value="0" max="100"></progress>');

        $progress = $('#progress-bar');
    }

    $progress.stop().fadeIn(250);

    return $progress;
}

function hideProgressBar($fade)
{
    $progress = $('#progress-bar');

    if($progress.length > 0)
    {
        $progress.stop();

        if($fade != undefined)
        {
            $progress.fadeOut($fade);
        } else {
            $progress.hide();
        }
    }
}

function loadPreviewImage($url, $offset, $container)
{
    $progress = showProgressBar();

    loadImage($url, ($ratio) =>
    {
      if($ratio == -1)
      {
        $progress.attr('value', 0);
      } else {
        $progress.attr('value', $ratio);
    }
    })
    .then($imgSrc =>
    {
        if($thumbnailIsLoading === true)
        {
            $container.append('<img src="{0}" onload="adjustThumbnail();" data-offset="{1}">'.f($imgSrc, $offset));
        }
        hideProgressBar(250);
    }, $xhr => {
        console.log($xhr); hideProgressBar(250);
    });
}

function getReadableFileSizeString(fileSizeInBytes)
{
    // https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string

    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];

    do {
        fileSizeInBytes = fileSizeInBytes / 1024; i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

function filerTable($query, $input)
{
    if(!$query || $query == undefined) { $('#indexer-files-table tr').show(); }

    $status = $input.parents('#search-filter').find('span').first(); $status.html('');

    $variables['currentItem'] = 0; $syntaxError = false;

    if($input != undefined) { $input.removeClass('error'); }

    $hidden = $totalSize = 0; $tableItems = $('#indexer-files-table .item');

    $tableItems.each(function()
    {
        $attributes = $(this).find('td');

        $filename = $attributes.first().attr('data-raw'); $filesize = $attributes.eq(2).attr('data-raw');

        if($filename != undefined)
        {
            try
            {
                if(!($filename).match(new RegExp($query, 'i')))
                {
                    $(this).hide(); $hidden++;
                } else {
                    $(this).show(); if($.isNumeric($filesize)) { $totalSize = ($totalSize + parseInt($filesize)); }
                }
            } catch (e)
            {
                if($input != undefined)
                {
                    $input.addClass('error'); $status.html('Syntax error :/'); $tableItems.show();

                    $syntaxError = true; return false;
                }
            }
        }
    });

    if($hidden > 0)
    {
        $('#file-count-bottom').html(($tableItems.length - $hidden) + '/' + $tableItems.length)
    } else {
        $('#file-count-bottom').html($('#file-count-bottom').attr('data-total'));
    }

    if($totalSize > 0)
    {
        if($hidden == 0)
        {
            $('#filesize-bottom').html($('#filesize-bottom').attr('data-total'));
        } else {
            $('#filesize-bottom').html(getReadableFileSizeString($totalSize));
        }
    } else {
        if(($tableItems.length - $hidden) == 0)
        {
            $('#filesize-bottom').html('0 kB');
        } else {
            $('#filesize-bottom').html($('#filesize-bottom').attr('data-total'));
        }
    }

    if($syntaxError == false)
    {
        $status.html('Showing ' + ($tableItems.length - $hidden) + ' matches ..');
    }
}

function toggleFilter()
{
    if(galleryIsVisible()) { return false; }

    $searchFilter = $('#search-filter');

    if($searchFilter.length > 0)
    {
        $searchFilter.toggle();

        if($searchFilter.is(':visible'))
        {
            $searchFilter.find('input').get(0).focus();
            $('body').css('padding-bottom', $searchFilter.innerHeight() + 'px');
        } else {
            $('body').css('padding-bottom', '0px');
        }
    } else {
        $searchFilter = $(document.createElement('div')).attr('id', 'search-filter');

        $searchFilter.append('<div><input type="text" placeholder="Search .."></div>');
        $searchFilter.append('<span></span>').append('<div id="search-filter-close"><span onclick="toggleFilter();">[X]</span></div>');

        $('body').append($searchFilter); $('#search-filter input').get(0).focus();

        $('body').css('padding-bottom', $searchFilter.innerHeight() + 'px');
    }
}

$(window).on('load', function()
{
    if($('table').find('.item > .preview > a').length > 0)
    {
        $('.upper-container').after('<div id="view-gallery" class="gallery-mode">[Gallery Mode]</div>');

        $('#view-gallery').show();

        if(isMobileDevice())
        {
            $variables['isMobile'] = true;
        }

        if($variables['isMobile'])
        {
            $('#view-gallery').wrap('<div class="upper-extras"></div>');
            $('.upper-extras').prepend('<div onclick="toggleFilter();">[Search Filter]</div>');
        }
    }

    loadOptions();
});

function setOptions($key, $value)
{
  localStorage.setItem($key, $value);
}

function loadOptions()
{
    $keys = [];

    $.each($options, function($index, $value)
    {
        $keys.push($index);
    });

    $.each($keys, function($index, $value)
    {
        $key = getLocalStorageKey($value);

        if($key !== null)
        {
            $options[$value] = $key;
        }
    });

    console.log($options);
}

$(document).ready(function()
{
    $('th.sortable').click(function()
    {
        $variables['currentItem'] = 0;

        // slightly modified version of this answer: https://stackoverflow.com/a/19947532

        var table = $(this).parents('table').eq(0);
        var rows = table.find('tr.item').toArray().sort(comparer($(this).index()));

        this.asc = !this.asc;

        if (!this.asc)
        {
          rows = rows.reverse();
        }

        for (var i = 0; i < rows.length; i++)
        {
          table.append(rows[i]);
        }
    });

    function comparer(index)
    {
        return function(a, b)
        {
            var valA = getCellValue(a, index), valB = getCellValue(b, index);
            return $.isNumeric(valA) && $.isNumeric(valB) ? valA - valB : valA.localeCompare(valB);
        }
    }

    function getCellValue(row, index)
    {
        return $(row).children('td').eq(index).attr("data-raw");
    }

    if($('body').find('#wget').length > 0)
    {
        $list = [];

        $element = $('.bottom > .command');

        $domain = document.location.origin + '/' + $element.attr('data-path');

        $('#indexer-files-table .item').each(function()
        {
            if($(this).find('td:last a').attr('filename'))
            {
                $filename = $(this).find('td').first().attr('data-raw');

                if($filename != undefined)
                {
                    $extension = $filename.substr($filename.lastIndexOf('.') + 1);

                    if($extension != undefined)
                    {
                        if(jQuery.inArray($extension, $list) == -1)
                        {
                            $list.push($extension);
                        }
                    }
                }
            }
        });

        if($list.length > 0 && $domain != undefined && $element != undefined)
        {
            $element.html('wget -r -np -nH -nd -e robots=off --accept "' + $list.join() + '" "' + $domain + '"');
        } else {
            $('#wget, .command, .command-bottom').remove();
        }
    } else {
        $('#wget, .command, .command-bottom').remove();
    }
});