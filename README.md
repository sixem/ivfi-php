# eyy-indexer
This is a simple file directory indexer / lister script written in PHP, with some help from Javascript and jQuery as well.

It is designed to have a retro and simple feel to it which is why it doesn't use any fancy font or icon packs.

JavaScript is not required for the Indexer but it is needed for the the extra functions (gallery mode, hover previews etc.).

You can visit the [demo](https://eyy.co/indexer-demo/) to view the indexer in action.

# Features
#### Gallery Mode
A gallery mode where you can view images and videos of the current directory without needing to visit each URL separately. It has support for downloading files and reverse searching images.
#### Hover Previews
Displays a preview of the image or video when hovering over the name.
#### And ..
+ File attributes (date modified and size).
+ Direct download links.
+ Clickable path for easy navigation.
+ Wget command for downloading the files of the current directory.

# Setup
See `/public/indexer.php` to see how it can be used. You may have to update the `require_once` path if you are using a custom location for the `/src/eyy-indexer.php`.

This script is meant to be used with rewrites instead of accessing the PHP file directly, you can see [example-apache-config.conf](https://github.com/sixem/eyy-indexer/blob/master/example-apache-config.conf) for an example of how this is done on Apache. I have not tested this on any other HTTP server but i'd imagine that adapting this method to something like nginx shouldn't be too hard.

# Options
You can pass an array of options to the Indexer when starting it to initializing it. Example:\

`$options = array('SHOW_VERSION' => true, 'IGNORED_EXTS' => array('exe', 'php'));`\
`$indexer = new indexer($options, '/images');`

Note that some of these options may have default values, setting a new value will not add to the existing ones but instead overwrite them.
#### PREVIEW_EXSTS *(Array)*
Decides what image and video extensions should have a hoverable preview. This will also decide what files will show up in the Gallery. Default: `'jpg', 'jpeg', 'png', 'gif', 'mp4', 'webm'`.
#### IGNORED_DIRS *(Array)*
What directory names should be ignored. Names only.
#### IGNORED_FILES *(Array)*
What file names should be ignored. Names only. Default: `'index.php', 'indexer.php'`.
#### DISABLED_DIRS *(Array)*
What paths should be disabled. This will show a forbidden error when attempting to access them.
#### SHOW_VERSION *(Boolean)*
Whether or not to display a version label at the bottom of the page. Default: `false`.
#### SHOW_WGET *(Boolean)*
Whether or not to display a wget command at the bottom of the page. This will display a simple command that can be used to download the contents of the current directory. Default: `true`.

# Requirements
### [mbstring](https://secure.php.net/manual/en/mbstring.installation.php)
mbstring provides multibyte specific string functions that help you deal with multibyte encodings in PHP.

It can be usually installed via your package manager (`sudo apt-get install php-*mbstring`).

## Complementary plugins
### [jquery.scrollTo](https://github.com/flesler/jquery.scrollTo)
Lightweight, cross-browser and highly customizable animated scrolling with jQuery.
### [Tocca.js](https://gianlucaguarini.com/Tocca.js/)
Super lightweight script to detect via Javascript events like 'tap' 'dbltap' 'swipeup' 'swipedown' 'swipeleft' 'swiperight' on any kind of device.
