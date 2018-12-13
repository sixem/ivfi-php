# eyy-indexer
This is a simple file directory indexer / lister script written in PHP, with some help from Javascript and jQuery as well.

It is designed to have a retro and simple feel to it which is why it doesn't use any fancy font or icon packs.

JavaScript is not required for the Indexer but it is needed for the the extra functions (gallery mode, hover previews etc.).

You can visit the [demo](https://eyy.co/indexer-demo/) to view the indexer in action.

# Features
#### Gallery Mode
A gallery mode where you can view images and videos of the current directory without the need to visit each URL separately. It has support for downloading files and reverse searching images.
#### Hover Previews
Displays a preview of the image or video when hovering over the name.
##### File attributes (date modified and size).
##### Direct download links.
##### Clickable path for easy navigation.
##### Wget command for downloading the files of the current directory.

# Requirements
### [mbstring](https://secure.php.net/manual/en/mbstring.installation.php)
mbstring provides multibyte specific string functions that help you deal with multibyte encodings in PHP.

It can be usually installed via your package manager (`sudo apt-get install php-*mbstring`).

## Complementary plugins
### [jquery.scrollTo](https://github.com/flesler/jquery.scrollTo)
Lightweight, cross-browser and highly customizable animated scrolling with jQuery.
### [Tocca.js](https://gianlucaguarini.com/Tocca.js/)
Super lightweight script to detect via Javascript events like 'tap' 'dbltap' 'swipeup' 'swipedown' 'swipeleft' 'swiperight' on any kind of device.
