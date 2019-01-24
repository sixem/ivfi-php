# eyy-indexer <a href="https://github.com/sixem/eyy-indexer/releases"><img src="https://img.shields.io/badge/version-1.0.4-brightgreen.svg?sanitize=true"></a>
This is a simple file directory indexer / lister script written in PHP, with some help from Javascript and jQuery as well.

This Indexer is designed to be a more image and video friendly Indexer while still having most of the basic functions of any other Indexer or Directory Lister. It is also designed to have a retro and simple feel to it which is why it doesn't use any fancy fonts or icon packs.

JavaScript is not required for the Indexer but it is needed for extra functionality (gallery mode, hover previews etc.).

You can visit the [demo](https://eyy.co/indexer-demo/) to view the indexer in action.

*Note: The demo will use the latest release which does not necessarily include the latest commits.*

#### Feedback
Feel free to come with any suggestions if you want something added or changed. I have not heavily tested this script so there are bound to be bugs that i do not know of so please don't hesitate reporting any bugs you may find.

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
+ Displays a Wget command for downloading the files from the current directory.
+ Mobile support (Work in progress).
# Setup
*Note: This setup is for the very last commits. If you are using one of the stable releases and there has been any commits since then, then please refer to the README file that comes with that release instead.*

Place the [/public/](https://github.com/sixem/eyy-indexer/blob/master/public/) files in your root web directory. The [/src/](https://github.com/sixem/eyy-indexer/blob/master/src/) files are recommended to be placed in a folder below your root directory called `src`, but you can place it wherever you want to, just remember that the [/public/indexer.php](https://github.com/sixem/eyy-indexer/blob/master/public/indexer.php) is set up to read from `../src/eyy-indexer.php` so you will have to update that if you are using a custom location for the [/src/eyy-indexer.php
](https://github.com/sixem/eyy-indexer/blob/master/src/eyy-indexer.php).
## Nginx
To use this script for all directories without a default index you need append `/indexer.php` to the end of your `index` line in your server configuration. This will tell Nginx to look for any of your default indexes and if none are found it'll then use the Indexer instead.

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
                index index.html index.htm index.php /indexer.php;
        }
}

```
## Apache
In order to automatically use this script you need to edit your Apache configuration. To do that you can place this line in your Apache configuration:

```
DirectoryIndex index.php index.html index.htm /indexer.php
```

This line can be placed in either your server's `.conf` file or your `.htaccess` file. This will tell Apache to look for a regular index file at first and if none are found it'll then use the Indexer instead.

If you want to disable direct access to the Indexer you can add these lines to your Apache configuration:


```
RewriteEngine On
RewriteRule ^/indexer.php(.*)$ - [R=404,L]
```

*Note: This requires the rewrite module to be enabled (`sudo a2enmod rewrite`).*

#### Alternative setup
You can also use the script by using rewrites. You can rewrite certain or all URLs to the Indexer by passing them via the `GET` parameter. You can see [example-apache-configs.md](https://github.com/sixem/eyy-indexer/blob/master/example-apache-configs.md) for an example of how this can be done.

# Requirements
### [mbstring](https://secure.php.net/manual/en/mbstring.installation.php)
mbstring provides multibyte specific string functions that help you deal with multibyte encodings in PHP.

It can (usually) be installed via your package manager (`sudo apt-get install php-*mbstring`).

# Configuration
There are options in [/src/eyy-indexer-config.php](https://github.com/sixem/eyy-indexer/blob/master/src/eyy-indexer-config.php) which can be customized.

You can pass a custom location for a config file by passing it as a second parameter when initializing the script.
```
$indexer = new indexer('/', '/var/www/custom/location/config.php');
```

# Plugins used
### [jquery.scrollTo](https://github.com/flesler/jquery.scrollTo)
Lightweight, cross-browser and highly customizable animated scrolling with jQuery.
### [Tocca.js](https://gianlucaguarini.com/Tocca.js/)
Super lightweight script to detect via Javascript events like 'tap' 'dbltap' 'swipeup' 'swipedown' 'swipeleft' 'swiperight' on any kind of device.

## Disclaimer
*Use this script at your own risk. There could be bugs that i do not know of.*