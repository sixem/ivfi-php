<h1 align="center">Configuration</h1>

<br/>

Here is an overview of what each configurable option does.

These options can be found and changed at the top of the `indexer.php` file, or you can create a config file that makes updating a bit easier (see below).

*Some* of these settings can be changed by the client/user. These are only values for the script to use as defaults.

## Configuration File

You can edit the configuration in the file directly, but if you wish to keep a separate config file that does not reset between updates, then creating your own config file can be a good solution.

The script will look for a config file in the same directory as the script. If the file is named `indexer.php` (as it is by default), then it'll look for a file called `indexer.config.php`. If you rename the file to `something.php`, then it'll look for `something.config.php` and so on.

Any values that are not present in the config file, will be set to the default value. It is also worth noting that having a `.` in front of the config file (hidden file) **will also work**.

A basic example of a config file:

```php
<?php
return array(
    'authentication' => array(
		'users' => array(
			'username' => 'password'
		),
		'restrict' => '/^\/(protected|secret|directory\/protected)\/?/i'
    ),
    'icon' => array(
        'path' => '/favicon.png',
        'mime' => 'image/png'
    ),
    'style' => array(
        'themes' => array(
            'path' => 'indexer/css/themes',
            'default' => false
        ),
        'compact' => true
    ),
    'gallery' => array(
        'image_sharpen' => true
    ),
    'debug' => true
);
?>
```

## Authentication
Key: **`authentication`**

Enables HTTP authentication through PHP (Digest access authentication).

Don't rely on this for any strong protection.

| Child key | Type | Value | Description |
|-----|------|---------|-------------|
| `users` | Array | `username => password` | Each key in the array represents a valid user where the value is the password.
| `restrict` | String | `regex` | Applies authentication exclusively to paths matching the regular expression.

Example:
```php
<?php
return array(
    'authentication' => array(
        'users' => array(
            'username' => 'password'
        ),
        'restrict' => '/^\/(protected|secret|directory\/protected)\/?/i'
    )
);
?>
```
This would apply authentication to `/protected/`, `/secret/` and `/directory/protected/`.

## Format
Key: **`format`**

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | String | `Index of %s` | Page title where  `%s` represents the current path.
| `date` | String/Array | `array('d/m/y H:i', 'd/m/y')` | Date format as per [datetime.format.php](https://www.php.net/manual/en/datetime.format.php#refsect1-datetime.format-parameters). Can be a string or an array. If it is an array then the first value will be shown on desktop devices and the second will be shown on mobile devices. It is a good idea to set a shorter mobile format because of the limited screen space.
| `sizes` | Array | `' B', ' KiB', ' MiB', ' GiB', ' TiB'` | Size formats for when displaying filesizes.

## Icon
Key: **`icon`**

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `path` | String | `/favicon.ico` | Path to a favicon.
| `mime` | String | `image/x-icon` | Favicon [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types)

## Sorting
Key: **`sorting`**

Default sorting settings.

Once the client sorts the items themselves, then those settings will be active for them instead.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `false` | Enables a specific sorting order on page-load. If disabled, it'll use the default order used by [scandir](https://www.php.net/manual/en/function.scandir.php).
| `order` | Integer | `SORT_ASC` | Sorting order. `SORT_ASC` or `SORT_DESC`.
| `types` | Integer | `0` | What item types to sort.<br/>`0` = Both. `1` = Files only. `2` = Directories only.
| `sort_by` | String | `name` | What to sort by. Available options are `name`, `modified`, `type` and `size`.
| `use_mbstring` | Bool | `false` | Enables [mbstring](https://www.php.net/manual/en/book.mbstring.php). This will solve some sorting issues with cyrillic capital letters et cetera, but it'll require `mbstring` to be installed. Only affects server-side sorting.

## Gallery
Key: **`gallery`**

The gallery plugin will display a gallery of the images and videos inside the current path.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `true` | Whether the gallery plugin should be enabled or not.
| `reverse_options` | Bool | `false` | Whether gallery images should have reverse search options or not.
| `scroll_interval` | Integer | `50` | Adds a forced break between scroll events in the gallery (`ms`).
| `list_alignment` | Integer | `0` | Gallery list alignment where `0` is `right` and `1` is `left`.
| `fit_content` | Bool | `true` | Whether images and videos should be forced to fill the available screen space.
| `image_sharpen` | Bool | `false` | Attempts to disable browser blurriness on images.

## Preview
Key: **`preview`**

The preview plugin displays a preview of the image or video when hovering over the filename.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `true` | Whether the preview plugin should be enabled or not.
| `hover_delay` | Integer | `75` | Adds a delay (`ms`) before the preview is displayed.
| `cursor_indicator` | Bool | `true` | Displays a loading cursor while the preview is loading.

## Extensions
Key: **`extensions`**

This setting decides which extensions will be marked as `media`.

This means that the extensions included here will have previews and will be included in the gallery mode.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `image` | Array | `'jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'` | Extensions marked as `image`.
| `video` | Array | `'webm', 'mp4', 'ogv', 'ogg', 'mov'` | Extensions marked as `video`.

## Inject
Key: **`inject`**

Injects any HTML code into the document.

This can be useful if you want to add meta tags or an external script, for example.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `head` | String / Function | `NULL` | Injects the code into the &lt;head&gt; of the document.
| `body` | String / Function | `NULL` | Injects (by prepending) the code into the &lt;body&gt; of the document.
| `footer` | String / Function | `NULL` | Injects (by appending) the code into the &lt;body&gt; of the document.

If the value is a function, then the returned string of that function will be used. The function will also be called with an argument containing an array with data that can be useful:
* `$param['path']` contains the currently shown path (example: `/files/directory/`)

* `$param['counts']` contains two keys — `files` and `directories` — both showing the respective file and directory count of the current directory.

* `$param['path']` contains two keys — `total` and `readable` — both showing the total size of the directory. The `total` value contains the total bytes and the `readable` value contains the readable size.

* `$param['config']` contains the parsed and active configuration.

## Metadata
Key: **`metadata`**

This option will add metadata to the header. This can be set globally using this option, or you can also set it on a per-directory basis using [dotfiles](dotfile.md).

Example:
```php
<?php
    return array(
        'metadata' => [
            [
                'property' => 'og:title',
                'content' => 'This is a title!'
            ]
	    ],
    );
?>
```

## Style
Key: **`style`**

Various visual options for the script.

The `compact` setting can be changed by the client in the settings menu, as can `themes`, if they are enabled.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `themes => path` | Bool/String | `/indexer/themes/` | Set to a path relative to the root directory containing `.css` files. Every `.css` file in the set folder will be treated as a separate theme.
| `themes => default` | Bool/String | `false` | Default theme for new clients to use. Takes a filename **without** the `.css` extension.
| `css => additional` | Array/String | `false` | Adds any additional CSS to the page. Can either be a pure CSS `string` or an `array` where the key is the selector and where the child keys and values are properties and values respectively.
| `compact` | Bool | `false` | Makes the page use a more compact and centered style.

## Filter
Key: **`filter`**

This option can be used if you want to filter the files or directories using `regular expressions`.

All filenames and directory names **matching** the `regex` will be shown. Please note that directory names will always end in a slash (`/`), this is done to make them easier to differentiate from files.

For example, setting `file` to `/^.{1,10}\.(jpg|png)$/` will only include `.jpg` and `.png` files with a filename between `1 - 10` characters in length when reading the directory files.

#### Another is example is when you want to hide files with invalid characters or specific filenames:

 `'/^(?!README\.md$|secret\.pwd$).*$/'`<br/>
This example will hide any `README.md` and `secret.pwd` files from the directory.

 `'/^[^\#\?]*$/'`<br/>
Will hide any filenames that contains `#` or `?`.

If you want to apply multiple filters easily, then you can also pass them as an array:
```php
'filter' => array(
    'file' => array(
        '/^(?!README\.md$|secret\.pwd$).*$/',
        '/^[^\#\?]*$/'
    ),
    'directory' => false
)
```
This will use both the filters above, and any filename that matches either of those will be hidden.

Setting the value to `false` will disable the filter.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `file` | Bool/String/Array | `false` | A `regexp` filter for what files should be included.
| `directory` | Bool/String/Array | `false` | A `regexp` filter for what directories should be included.

## Exclude
Key: **`exclude`**

This option will exclude certain extensions from showing up in any directory.

An example that'll exclude any `jpg` or `jpeg` files:
```php
<?php
    return array(
        'exclude' => ["jpg", "jpeg"]
    );
?>
```

## Directory Sizes
Key: **`directory_sizes`**

Shows the sizes of directories.

Leaving this off is recommended as calculating the directory sizes can be a bit intensive, especially with the recursive option.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `false` | Whether directory sizes should be calculated or not.
| `recursive` | Bool | `false` | Recursively scans the directories when calculating the size.

## Footer
Key: **`footer`**

Shows a footer with some general information at the bottom of the page.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `true` | Whether the footer should be displayed or not.
| `show_server_name` | Bool | `true` | Shows the `server_name` of the current server in the footer.

## Other
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `processor` | Bool | `false` | Allows you to handle and modify data by passing functions to the indexer. See [PROCESSOR](processor.md) for more information.
| `single_page` | Bool | `false` | Enables navigation between folders without forcing a page reload (experimental).
| `encode_all` | Bool | `false` | Should `?` and `#` characters be encoded when processing URLs and filenames.
| `allow_direct_access` | Bool | `false` | Whether direct access to the `indexer.php` should be allowed or not.
| `path_checking` | String | `strict` | Use `weak` if you need to support symbolic link directories. `strict` will use [realpath](https://www.php.net/manual/en/function.realpath.php) when verifiying the location of the current directory, whereas `weak` will use a similar string-based approach which doesn't resolve symbolic links.
| `performance` | Bool | `false` | Enables [performance mode](performance.md). `true` will enable it for all folders, while setting it to a number, will enable it on directories above or equal to that respective amount of files.
| `footer` | Bool | `true` | Setting this to `true` or `false` will enable or disable the path, site and generation time in the footer respectively.
| `credits` | Bool | `true` | When set to true, it will display a simple link to the git repository in the footer along with the version number. I would appreciate it if you keep this enabled, but i also understand that it is not always desirable, so the option to hide it is there.
| `debug` | Bool | `false` | Enables PHP debugging and `console.log()` info messages.

# Advanced
## Server <!-- {docsify-ignore} -->

Some server variables can be passed to the script via your web server in order to modify some of the more advanced features of the script.

### Base Path
| Key | Type | Description |
|-----|------|-------------|
| `INDEXER_BASE_PATH` | String | Overrides the default base directory of the script.

This option can be used if you are dealing with a dynamic `root` path or if you want to place the script outside of the `root` directory, for example.

This does **not** work with themes out of the box.

Example usage with Nginx:
```
    location ~ ^/.+\.php(/|$) {
        ...
        fastcgi_param INDEXER_BASE_PATH     /servePoint;
        ...
    }
```

### Path Prepending
| Key | Type | Description |
|-----|------|-------------|
| `INDEXER_PREPEND_PATH` | String | Adds a path to the beginning of every parsed path and file in the script.

This option can be used if you for example are serving the script through a reverse proxy to a path that is not the actual web root.

This can also be set as a header (`X-Indexer-Prepend-Path`) in cases where the script is being processed through a proxy.

#### An example where this can be used:

Assume you are serving the script through a proxied server:
```
location /file/upstream/ {
        proxy_pass http://192.168.1.100:8080/;

        proxy_set_header X-Indexer-Prepend-Path "/file/upstream/";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

If `X-Indexer-Prepend-Path` is excluded from this configuration, the script would not know that it is actually supposed to serve the files from `/file/upstream/` instead of `/`, thus the navigation and file links would point to incorrect directories and files.

By setting the prepend value to `/file/upstream/`, every link will have that string prepended to it, so a file like `/image.jpg` would correctly point to `/file/upstream/image.jpg`.

#### Note:

This does not prepend any assets file, so the assets will have to be placed in the root directory or forwarded from a directory or a proxy to `/indexer/` in the web root.
