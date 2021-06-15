# Configuration

Here is an overview of what each configurable option does.

These options can be found and changed at the top of the [indexer.php](public/indexer.php) file, or you can create a config file that makes updating a bit easier (see below).

Some of these settings can be changed by the client/user. These are only values for the script to use as defaults.

## First.. How do i keep config values between updates?

You can edit the configuration in the file directly, but if you wish to keep a separate config file that does not reset between updates, then creating your own config file can be a good solution.

The script will look for a config file in the same directory as the script. If the file is named `indexer.php` (as it is by default), then it'll look for a file called `indexer.config.php`. If you rename the file to `something.php`, then it'll look for `something.config.php` and so on.

Any values that are not present in the config file, will be set to the default value. It is also worth noting that having a `.` in front of the config file (hidden file) **will also work**.

A basic example of a config file:
```php
<?php
return array(
    'authentication' => array(
        'mysecretusername' => 'supersecretpassword'
    ),
    'icon' => array(
        'path' => 'https://cdn1.five.sh/assets/media/five.png',
        'mime' => 'image/png'
    ),
    'style' => array(
        'themes' => array(
            'path' => 'indexer/css/themes',
            'default' => 'pelagic'
        ),
        'compact' => true
    ),
    'debug' => true
);
?>
```

## Authentication
Key: **`authentication`**

Enables HTTP authentication through PHP. Don't rely on this for any strong protection.

| Child key | Type | Value | Description |
|-----|------|---------|-------------|
| `username` | String | `password` | Each key in the array represents a valid user where the value is the password.

## Format
Key: **`format`**

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | String | `Index of %s` | Page title where  `%s` represents the current path.
| `date` | String / Array | `array('d/m/y H:i', 'd/m/y')` | Date format as per [datetime.format.php](https://www.php.net/manual/en/datetime.format.php#refsect1-datetime.format-parameters). Can be a string or an array. If it is an array then the first value will be shown on desktop devices and the second will be shown on mobile devices. It is a good idea to set a shorter mobile format because of the limited screen space.
| `sizes` | Array | `' B', ' kB', ' MB', ' GB', ' TB'` | Size formats for when displaying filesizes.

## Icon
Key: **`icon`**

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `path` | String | `/favicon.png` | Path to a favicon.
| `mime` | String | `image/png` | Favicon [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types)

## Sorting
Key: **`sorting`**

Default sorting settings. Once the client sorts the items themselves, then those settings will be active for them instead.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `false` | Enables a specific sorting order on page-load. If disabled, it'll use the default order used by [scandir](https://www.php.net/manual/en/function.scandir.php).
| `order` | Integer | `SORT_ASC` | Sorting order. `SORT_ASC` or `SORT_DESC`.
| `types` | Integer | `0` | What item types to sort. `0` = Both. `1` = Files only. `2` = Directories only.
| `sort_by` | String | `name` | What to sort by. Available options are `name`, `modified`, `type` and `size`.
| `use_mbstring` | Boolean | `false` | Enables [mbstring](https://www.php.net/manual/en/book.mbstring.php). This will solve some sorting issues with cyrillic capital letters et cetera, but it'll require `mbstring` to be installed. Only affects server-side sorting.

## Gallery
Key: **`gallery`**

The gallery plugin will display a gallery of the images and videos inside the current path.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `true` | Whether the gallery plugin should be enabled or not.
| `reverse_options` | Boolean | `false` | Whether gallery images should have reverse search options or not.
| `scroll_interval` | Integer | `50` | Adds a forced break between scroll events in the gallery (`ms`).
| `list_alignment` | Integer | `0` | Gallery list alignment where `0` is `right` and `1` is `left`.
| `fit_content` | Boolean | `true` | Whether images and videos should be forced to fill the available screen space.
| `image_sharpen` | Boolean | `false` | Attempts to disable browser blurriness on images.
| `blur` | Boolean | `true` | Enables gallery background blur (can affect performance negatively on larger directories).

## Preview
Key: **`preview`**

The preview plugin displays a preview of the image or video when hovering over the filename.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `true` | Whether the preview plugin should be enabled or not.
| `hover_delay` | Integer | `75` | Adds a delay (`ms`) before the preview is displayed.
| `cursor_indicator` | Boolean | `true` | Displays a loading cursor while the preview is loading.

## Extensions
Key: **`extensions`**

This setting decides which extensions will be marked as `"media"`.

This basically means that the extensions included here will have previews and will be included in the gallery mode.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `image` | Array | `'jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'` | Extensions marked as `image`.
| `video` | Array | `'webm', 'mp4', 'ogg', 'ogv'` | Extensions marked as `video`.

## Style
Key: **`style`**

Various visual options for the script. The `compact` setting can be changed by the client in the settings menu, as can `themes`, if they are enabled.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `themes => path` | Boolean / String | `false` | Set to a path relative to the root directory containing `.css` files. Example: `/indexer/css/themes/` (This directory also contains a few included **example** themes). Every `.css` in the set folder will be treated as a separate theme.
| `themes => default` | Boolean / String | `false` | Default theme for new clients to use. Takes a filename **without** the `.css` extension.
| `compact` | Boolean | `false` | Makes the page use a more compact and centered style.

## Filter
Key: **`filter`**

This option can be used if you want to filter the files or directories using `regular expressions`.

All filenames and directory names **matching** the `regex` will be shown.

For example, setting `file` to `/^.{1,10}\.(jpg|png)$/` will only include `.jpg` and `.png` files with a filename between `1 - 10` characters in length when reading the directory files.

Setting the value to `false` will disable the filter.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `file` | Boolean / String | `false` | A `regexp` filter for what files should be included.
| `directory` | Boolean / String | `false` | A `regexp` filter for what directories should be included.

## Directory Sizes
Key: **`directory_sizes`**

Shows the sizes of directories.

Leaving this off is recommended as calculating the directory sizes can be a bit intensive, especially with the recursive option.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `false` | Whether directory sizes should be calculated or not.
| `recursive` | Boolean | `false` | Recursively scans the directories when calculating the size.

## Other
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `processor` | Boolean | `false` | Allows you to handle and modify data by passing functions to the indexer. See [PROCESSOR.md](PROCESSOR.md) for more information.
| `encode_all` | Boolean | `false` | Should `?` and `#` characters be encoded when processing URLs and filenames.
| `allow_direct_access` | Boolean | `false` | Whether direct access to the `indexer.php` should be allowed or not.
| `path_checking` | String | `strict` | Use `weak` if you need to support symbolic link directories. `strict` will use [realpath](https://www.php.net/manual/en/function.realpath.php) when verifiying the location of the current directory, whereas `weak` will use a similar string-based approach which doesn't resolve symbolic links.
| `performance` | Boolean | `false` | Enables an experimental [performance mode](PERFORMANCE.md). `true` will enable it for all folders, while setting it to a number, will enable it on directories above or equal to that respective amount of files.
| `footer` | Boolean | `true` | Setting this to `true` or `false` will enable or disable the path, site and generation time in the footer respectively.
| `credits` | Boolean | `true` | When set to true, it will display a simple link to the git repository in the footer along with the version number. I would appreciate it if you keep this enabled, but i also understand that it is not always desirable, so the option to hide it is there.
| `debug` | Boolean | `false` | Enables PHP debugging and `console.log` info messages.

# Advanced
Advanced settings that are not a part of the regular configuration.
## Server
You can set some server variables (`$_SERVER`) to modify how the script works.
| Key | Type | Description |
|-----|------|-------------|
| `INDEXER_BASE_PATH` | String | Overrides the default base directory of the script. Can be used if you are dealing with a dynamic `root` path or if you want to place the script outside of the `root` directory, for example. This does **not** work with themes out of the box.