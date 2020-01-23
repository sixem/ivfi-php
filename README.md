# eyy-indexer <a href="https://github.com/sixem/eyy-indexer/releases"><img src="https://img.shields.io/badge/version-1.1.0-brightgreen.svg?sanitize=true"></a>
This is a simple file directory indexer / lister script written in PHP, with some help from Javascript and jQuery as well.

This Indexer is designed to be a more image and video friendly Indexer while still having most of the basic functions of any other Indexer or Directory Lister. It is also designed to have a retro and simple feel to it which is why it doesn't use any fancy CSS or icon packs.

JavaScript is not required for the Indexer but it is needed for the extra functionality.

You can visit the [demo](https://five.sh/demo/indexer/) to view the indexer in action.

#### Feedback
Feel free to let me know if you have any ideas on what to change or add, or if you experience any bugs or errors.

# Features
#### Gallery Mode
A gallery mode where you can view images and videos of the current directory without needing to visit each URL separately. It has support for downloading files and reverse searching images.
#### Hover Previews
Displays a preview of the image or video when hovering over the name.
#### Search Filter
The search filter can be used to search for filenames or filetypes in the current directory. Usage (Desktop): `Shift + F`.
#### And some other minor features ..
+ File attributes (date modified and size).
+ Direct download links.
+ Clickable path for easy navigation.
+ A copyable wget command for downloading the files from the current directory.
+ Mobile support

# Setup
Place the files inside the [public](https://github.com/sixem/eyy-indexer/blob/master/public/) directory into your root web directory.

## Nginx
To use this script for all directories without a default index you need append `/indexer.php` to the end of your `index` line in your server configuration. This will tell Nginx to use the Indexer if none of the default indexes exist.

Example usage:
```
server {
        index index.html index.htm index.php /indexer.php;
}

```
Alternatively, you can only make it work for certain directories:
```
server {
        location ~ ^/(videos|images)/ {
                index /indexer.php;
        }
}

```
## Apache
In order to automatically use this script you need to edit your Apache configuration. To do that you can place this line in your Apache configuration:

```
DirectoryIndex index.php index.html index.htm /indexer.php
```

This line can be placed in either your server's `.conf` file or your `.htaccess` file. This will tell Apache to use the Indexer if none of the default indexes exist.

# Configuration
There is an array of options at the very top of [indexer.php](https://github.com/sixem/eyy-indexer/blob/master/public/indexer.php) which can be customized.

The extension option decides what extensions should be targeted by the gallery and preview scripts.
The rest of the options should be fairly self-explanatory.

# Source
The files inside [/.source/](https://github.com/sixem/eyy-indexer/blob/master/.source/) are **NOT** needed in order to run this script.

This directory contains the uncompressed (and untranspiled) source files of the script (.css, .js etc.), so you can use these files if you want to customize or edit the script in any way.

# Plugins / Libraries used
### [modernizr.mq](https://github.com/Modernizr/Modernizr)
Modernizr is a JavaScript library that detects HTML5 and CSS3 features in the user’s browser.

### [image.preview.js](https://github.com/sixem/image.preview.js)
A simple jQuery plugin that adds hoverable image and video previews to links and other elements.

### [jquery.scrollTo](https://github.com/flesler/jquery.scrollTo)
Lightweight, cross-browser and highly customizable animated scrolling with jQuery.

### [jquery.detectSwipe](http://github.com/marcandre/detect_swipe)
Gives easy access to left/right/up/down swipe events for iOS and other touch devices.

## Disclaimer
*Use this script at your own risk. There could be bugs that i do not know of.*