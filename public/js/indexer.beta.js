/* indexer.js [https://github.com/sixem/eyy-indexer] */

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

$extensions = {
    'image' : ['jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp'],
    'video' : ['mp4', 'webm']
};

$options = {
    'indexer.UseXMLHttpRequest' : true,
    'gallery.Hover.ShowImageOptions' : true,
    'gallery.ScrollInterval' : 0
};

function isMobileDevice()
{
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? true : false;
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

    if($value === null)
    {
        return null;
    } else {
        if($value == 'false' || $value == 'true')
        {
            return JSON.parse($value);
        } else {
            if($.isNumeric($value))
            {
                return parseInt($value);
            }
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
        'Google': 'https://www.google.com/searchbyimage?image_url=' + $url + '&safe=off',
        'Yandex': 'https://www.yandex.com/images/search?rpt=imageview&img_url=' + $url,
        'IQDB': 'https://iqdb.org/?url=' + $url
    };
}

function applySwipeEventListeners()
{
    if($variables['isMobile'] == true)
    {
        $container = $(document).find('.gallery-item-container');

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
    if($options['gallery.Hover.ShowImageOptions'])
    {
        $opts = '<a href="' + $source + '" target="_blank">Direct Link</a>';

        if($variables['currentItemType'] == 1)
        {
            $.each(getReverseImageSearchOptions(document.location.origin + $source), function($key, $value)
            {
                $opts += '|<a target="_blank" href="' + $value + '">' + $key + '</a>';
            });
        }

        if($('#image-container > .tb-reverse-search-container').length == 0)
        {
            $('#image-container').prepend('<div class="tb-reverse-search-container"></div>');
        }

        if($('#video-container > .tb-reverse-search-container').length == 0)
        {
            $('#video-container').prepend('<div class="tb-reverse-search-container"></div>');
        }

        $('#video-container > .tb-reverse-search-container, #image-container > .tb-reverse-search-container').html($opts);
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
    $main = $('body').find('.content-main');

    $x = $(window).innerWidth - $(document).width();

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
            'padding-right' : $x + 'px'
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
    $variables['topbarHeight'] = $(document).find('.gallery-topbar').outerHeight();

    $list = $(document).find('#gallery-list');

    if($list.length > 0)
    {
        $list.css(
            {
                'height' : 'calc(100vh - ' + ($variables['topbarHeight'] + 2) + 'px)',
                'margin-top' : '0 px'
            }
        );
    }

    $(document).find('#gallery-container').css({
        'margin-top' : $variables['topbarHeight'] + 'px',
        'height' : 'calc(100vh - ' + $variables['topbarHeight'] + 'px'
    });

    if($variables['isMobile'])
    {
        $navigationBars = $(document).find('.navigation-overlay-left, .navigation-overlay-right');

        $navigationBars.css({
            'margin-top' : $variables['topbarHeight'] + 'px',
            'height' : 'calc(100vh - ' + $variables['topbarHeight'] + 'px)'
        });
    }
}

function galleryLoading($state)
{
    $variables['galleryIsBusy'] = $state;

    if($state == true)
    {
        $x = $('#gallery-loading');

        if($x.length == 0)
        {
            $(document).find('.tb-items').find('div').prepend('<span id="gallery-loading">[Loading ..]</span>');
        }

        $('#gallery-loading').fadeIn(500);
    } else {
        $x = $('#gallery-loading'); $x.stop();

        $x.fadeOut(100, function()
        {
            $('#gallery-loading').remove(); adjustGalleryItems();
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
    if($(document).find('#gallery-container').length > 0)
    {
        return true;
    } else {
        return false;
    }
}

function galleryHandleKey($keycode)
{
    if(galleryIsVisible())
    {
        if($keycode == 27)
        {
            galleryClose();
        }
        if($keycode == 37)
        {
            galleryNavigate(-1);
        }
        if($keycode == 39)
        {
            galleryNavigate(1);
        }

        if(doesGalleryListExist())
        {
            if($keycode == 38 || $keycode == 33)
            {
                galleryNavigate(-1);
            }

            if($keycode == 40 || $keycode == 34)
            {
                galleryNavigate(1);
            }
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
    if($(document).find('#gallery-list').is(':visible'))
    {
        return true;
    } else {
        return false;
    }
}

function doesGalleryListExist()
{
    if($(document).find('#gallery-list').length > 0)
    {
        return true;
    } else {
        return false;
    }
}

function hideGalleryList()
{
    $list_container = $(document).find('#gallery-list');

    if(isGalleryListVisible())
    {
        $list_container.hide();

        $list_toggle_button = $(document).find('#gallery-toggle-list');

        $list_toggle_button.attr('onclick', 'showGalleryList();');
        $list_toggle_button.text('[List+]');

        $variables['galleryListShow'] = false;
    }
}

function showGalleryList()
{
    $list_toggle_button = $(document).find('#gallery-toggle-list');

    $variables['galleryListShow'] = true;

    if(doesGalleryListExist() && isGalleryListVisible() == false)
    {
        $(document).find('#gallery-list').show();

        $list_toggle_button.text('[List-]');
        $list_toggle_button.attr('onclick', 'hideGalleryList();');

        return true;
    }

    if(galleryIsVisible() && doesGalleryListExist() == false)
    {
        $list_toggle_button.text('[List-]');
        $list_toggle_button.attr('onclick', 'hideGalleryList();');

        $table = '<table cellspacing="0"><tbody></tbody></table>';

        $container = $(document).find('#gallery-container').first();
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
    $list = $(document).find('#gallery-list');

    $x = $list.find('table > tbody').find('tr');

    $current = $x.eq($index).find('td').first();

    $x.each(function()
    {
        $y = $(this).find('td').first();

        if($y.hasClass('selected'))
        {
            $y.removeClass('selected');
        }
    });

    if($current != undefined)
    {
        if(!isScrolledIntoView($current, $current.height()))
        {
            $y = $list.scrollTop() + ($current.offset().top - $list.offset().top);

            $list.scrollTo($current);
        }
    }

    $current.addClass('selected');
}

function waitForVideo($video, $pseudo)
{
    if($pseudo == undefined){ $pseudo = false; }

    function checkLoad()
    {
        if($video.prop('readyState') == 4 || $video.prop('readyState') == 3)
        {
            galleryLoading(false);

            $container = $(document).find('#video-container');

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

    $video_container = $('.gallery-item-container').find('#video-container');

    if($video_container.find('source').length > 0)
    {
        $video_container.find('video').get(0).pause();
    }

    if(arrayContains($ext, $extensions['image']))
    {
        $variables['currentItemType'] = 1;

        if($('.gallery-item-container').find('#image-container').length == 0)
        {
            $('.gallery-item-container').append('<div id="image-container"><img src=""></div>');
        }

        $img = new Image();

        $($img).on('load', function()
        {
            $('.gallery-item-container > #image-container > img').attr('src', $img.src);

            galleryLoading(false);

            $('.gallery-item-container > #image-container').show();

            $video_container.hide();
        });

        $img.src = $source;
    }

    if(arrayContains($ext, $extensions['video']))
    {
        $variables['currentItemType'] = 2;

        if($video_container.length == 0)
        {
            $('.gallery-item-container').append('<div id="video-container"><video controls loop><source src=""></video></div>');

            $video = $(document).find('#video-container').find('video');
            $video.find('source').attr('src', $source);
            $video.load();

            waitForVideo($video, false);
        } else {
            $container = $(document).find('#video-container');

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
        'filename_full' : $item.attr('data-raw'),
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

    $download = $(document).find('.tb-download');

    if($download.length > 0)
    {
        $download.attr({
            'filename' : $item['filename_full'],
            'href' : $item['url']
        });
    }

    $(document).find('.tb-current-item').html($counter + $data.f(
        $item['url'],
        $item['filename_full'],
        $item['modified'],
        $item['filename'],
        $item['filesize']
    ));
}

function galleryNavigate($i, $direct)
{
    $direct = $direct || false; if($variables['galleryIsBusy'] == true) { return false; }

    setCurrentItem($i, $direct);

    showGalleryOverlay($variables['currentItem'], undefined, true);

    if(isGalleryListVisible())
    {
        setGalleryListSelected($variables['currentItem']);
    }

    galleryLoading(true);

    if($('#gallery-container').find('.gallery-item-container').length > 0)
    {
        updateTbFileInfo(getItemData($variables['galleryItems'].eq($variables['currentItem'])));
    }

    galleryLoadItem($variables['galleryItems'].eq($variables['currentItem']).attr('data-thumb'));
}

$shift_key = false;

$(document).keydown(function(e)
{
    $shift_key = e.shiftKey;

    if(e.keyCode == 27)
    {
        $elem = $('#search-filter');

        if($elem.is(':visible') && $elem.find('input').is(':focus'))
        {
            toggleFilter();
        }
    }

    if(e.keyCode == 70 && $shift_key == true)
    {
        $elem = $('#search-filter');

        if($elem.is(':visible') && $elem.find('input').is(':focus'))
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
    $shift_key = e.shiftKey;

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
    if($options['gallery.Hover.ShowImageOptions'])
    {
        $('.tb-reverse-search-container').stop(); $('.tb-reverse-search-container').fadeIn(88);
    }
});

$(document).on('mouseleave', '#image-container, #video-container',function(e)
{
    if($options['gallery.Hover.ShowImageOptions'])
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

    if($('body').find('#gallery-container').length === 0)
    {
        $('body').prepend('<div id="gallery-container"></div>');
        disableMainScrolling(true);
    }

    $variables['galleryItems'] = $('#indexer-files-table .item:visible .preview'); galleryNavigate(0);
});

$(document).on('click', '.copy.wget', function()
{
    copyToClipboard('.bottom > .command.wget');

    $fade_time = 150;

    $(this).fadeOut($fade_time);

    $(this).promise().done(function()
    {
        $(this).css('color', '#32c232');
        $(this).text('[Copied to clipboard!]');
        $(this).fadeIn($fade_time);
    });

    setTimeout(function ()
    {
        $elem_this = $('.copy.wget');

        $elem_this.fadeOut($fade_time);

        $elem_this.promise().done(function()
        {
            $elem_this.css('color', $('.bottom').css('color'));
            $elem_this.text('[Copy to clipboard]');
            $elem_this.fadeIn($fade_time);
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

    return $(document).find('#thumbnail-container');
}

function adjustThumbnail($container)
{
    $container = $(document).find('#thumbnail-container');

    $child = $container.children().first();

    if($child.is('img'))
    {
        $src = $child.attr('src');
    } else {
        if($child.is('video'))
        {
            $src = $child.find('source').attr('src');
        } else {
            $src = undefined;
        }
    }

    if($variables['lastAdjusted'] != $src)
    {
        $container.show();

        $container_media = $container.find('img, video');

        $container_media.css('max-width', (($(window).width() - $container.position()['left']) - 25)+'px');

        $y = ($container.outerHeight() / 100) * (($container_media.attr('data-offset') - $(window).scrollTop()) / $(window).height()) * 100;

        $container.css('top', $container.css('top').replace(/[^-\d\.]/g, '') - $y);

        $variables['lastAdjusted'] = $src;

    }

    $child.css('visibility', 'visible');

    $container.css({
        'max-height' : '100vh',
        'max-width' : '100vw'
    });
}

function showThumbnail($trigger)
{
    $item = getItemData($trigger);

    $variables['lastPreview'] = $item['filename_full'];

    $container = $(document).find('#thumbnail-container');

    if($(document).find('#thumbnail-container').length == 0)
    {
        $container = createThumbnailContainer();
    }

    $container.html('');

    $x = getElementPositions($trigger);

    $container.css({
        'left' : ($x['left'] + $x['width'] + 15),
        'top' : $x['top']
    });

    if(arrayContains($item['ext'], $extensions['image']))
    {
        if($options['indexer.UseXMLHttpRequest'])
        {
            loadPreviewImage($item['url'], Math.round($x['top']), $container);
        } else {
            $container.append('<img src="{0}" onload="adjustThumbnail();" data-offset="{1}">'.f($item['url'], Math.round($x['top'])));
        }
    } else {
        if(arrayContains($item['ext'], $extensions['video']))
        {
            $v = '<video loop autoplay oncanplay="adjustThumbnail(); this.volume=0;" data-offset="'+Math.round($x['top'])+'">'+
            '<source src="'+$item['url']+'"></video>';

            $container.append($v);
        }
    }
}

function hideThumbnail()
{
    $container = $(document).find('#thumbnail-container');

    $container.html(''); $container.hide(); $variables['lastAdjusted'] = undefined;
}

function showGalleryOverlay($start, $show_list, $navigate)
{
    hideThumbnail();

    if($show_list == undefined && $variables['galleryListShow'] != undefined)
    {
        $show_list = $variables['galleryListShow'];
    }

    $start = $start || 0; $show_list = $show_list || false; $navigate = $navigate || false;

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

    if($('#gallery-container').find('.gallery-item-container').length == 0)
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
    }

    if($navigate != true)
    {
        galleryLoadItem($variables['galleryItems'].eq($variables['currentItem']).attr('data-thumb'));
    }

    if($show_list)
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
});

$scroll_break = false;

function scrollEventBreak()
{
    $scroll_break = false;
}

$(document).on('DOMMouseScroll mousewheel', '.gallery-item-container', function(e)
{
    if(e.originalEvent.detail > 0 || e.originalEvent.wheelDelta < 0)
    {
        if($scroll_break === false)
        {
            galleryNavigate(1);

            if($options['gallery.ScrollInterval'] > 0)
            {
                $scroll_break = true; setTimeout(scrollEventBreak, $options['gallery.ScrollInterval']);
            }
        }
    } else {
        if($scroll_break === false)
        {
            galleryNavigate(-1);

            if($options['gallery.ScrollInterval'] > 0)
            {
                $scroll_break = true; setTimeout(scrollEventBreak, $options['gallery.ScrollInterval']);
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
    $progress = $('body').find('#progress-bar');

    if($progress.length > 0)
    {
        $progress.attr('value', 0);
    } else {
        $('body').prepend('<progress id="progress-bar" value="0" max="100"></progress>');

        $progress = $('body').find('#progress-bar');
    }

    $progress.stop().fadeIn(250);

    return $progress;
}

function hideProgressBar($fade)
{
    $progress = $('body').find('#progress-bar');

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
        $container.append('<img src="{0}" onload="adjustThumbnail();" data-offset="{1}">'.f($imgSrc, $offset));
        hideProgressBar(250);
    }, $xhr => {
        console.log($xhr); hideProgressBar(250);
    });
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

function getReadableFileSizeString(fileSizeInBytes)
{
    /* https://stackoverflow.com/questions/10420352/converting-file-size-in-bytes-to-human-readable-string */

    var i = -1;
    var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];

    do {
        fileSizeInBytes = fileSizeInBytes / 1024;
        i++;
    } while (fileSizeInBytes > 1024);

    return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
};

function filerTable($query, $input)
{
    if(!$query || $query == undefined) { $('#indexer-files-table tr').show(); }

    $status = $input.parents('#search-filter').find('span').first(); $status.html('');

    $variables['currentItem'] = 0; $syntax_error = false;

    if($input != undefined) { $input.removeClass('error'); }

    $hidden = $total_size = 0; $table_items = $('#indexer-files-table .item');

    $table_items.each(function()
    {
        $attrs = $(this).find('td');

        $filename = $attrs.first().attr('data-raw'); $filesize = $attrs.eq(2).attr('data-raw');

        if($filename != undefined)
        {
            try
            {
                if(!($filename).match($query, 'i'))
                {
                    $(this).hide(); $hidden++;
                } else {
                    $(this).show(); if($.isNumeric($filesize)) { $total_size = ($total_size + parseInt($filesize)); }
                }
            } catch (e)
            {
                if($input != undefined)
                {
                    $input.addClass('error'); $status.html('Syntax error :/'); $table_items.show();

                    $syntax_error = true; return false;
                }
            }
        }
    });

    if($hidden > 0)
    {
        $('#file-count-bottom').html(($table_items.length - $hidden) + '/' + $table_items.length)
    } else {
        $('#file-count-bottom').html($('#file-count-bottom').attr('data-total'));
    }

    if($total_size > 0)
    {
        if($hidden == 0)
        {
            $('#filesize-bottom').html($('#filesize-bottom').attr('data-total'));
        } else {
            $('#filesize-bottom').html(getReadableFileSizeString($total_size));
        }
    } else {
        if(($table_items.length - $hidden) == 0)
        {
            $('#filesize-bottom').html('0 kB');
        } else {
            $('#filesize-bottom').html($('#filesize-bottom').attr('data-total'));
        }
    }

    if($syntax_error == false)
    {
        $status.html('Showing ' + ($table_items.length - $hidden) + ' matches ..');
    }
}

function toggleFilter()
{
    $elem = $('#search-filter');

    if($elem.length > 0)
    {
        $elem.toggle();

        if($elem.is(':visible')) { $elem.find('input').get(0).focus(); }
    } else {
        $filter = $(document.createElement('div')).attr('id', 'search-filter');

        $filter.append('<div><input type="text" placeholder="Search .."></div>');
        $filter.append('<span></span>').append('<div id="search-filter-close"><span onclick="toggleFilter();">[X]</span></div>');

        $('body').append($filter); $('#search-filter input').get(0).focus();
    }
}

$(window).on('load', function()
{
    if($('table').find('.item > .preview > a').length > 0)
    {
        $('.upper-container').after('<div id="view-gallery" class="gallery-mode">[Gallery Mode]</div>');

        $(document).find('#view-gallery').show();

        if(isMobileDevice())
        {
            $variables['isMobile'] = true;
        }

        if($variables['isMobile'])
        {
            $('body').find('#view-gallery').wrap('<div class="upper-extras"></div>');
            $('body').find('.upper-extras').prepend('<div onclick="toggleFilter();">[Search Filter]</div>');
        }
    }

    loadOptions();
});

$(document).ready(function()
{
    $('th.sortable').click(function()
    {
        /* slightly modified version of this answer: https://stackoverflow.com/a/19947532 */

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

        $element = $('body').find('.bottom > .command');

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
            $('body').find('#wget, .command, .command-bottom').remove();
        }
    } else {
        $('body').find('#wget, .command, .command-bottom').remove();
    }
});