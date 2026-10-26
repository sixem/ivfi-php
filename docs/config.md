<h1 align="center">Configuration</h1>

<br/>

Edit the settings at the top of `indexer.php`, or use a separate config file to keep settings across updates. User preferences override some display defaults.

## Configuration File

Create `indexer.config.php` beside the script. If you rename the script, match the config name; hidden names such as `.indexer.config.php` also work.

The PHP working directory is checked before the script's directory.

Return an array containing the settings you want to change. Missing or null settings use defaults; lists such as extensions replace their defaults, even when empty.

```php
<?php
return [
    'style' => ['compact' => true],
    'gallery' => ['image_sharpen' => true]
];
```

## Authentication
Key: **`authentication`**

Enables HTTP authentication through PHP (Digest access authentication).

Protects listings handled by IVFi, not files served directly by your web server. Use HTTPS and server-level access controls for private files. Captured authenticated requests can still be replayed.

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
        'restrict' => '~^/(protected|secret|directory/protected)(/|$)~i'
    )
);
?>
```
This protects `/protected/`, `/secret/` and `/directory/protected/`, including their children.

Restrictions also check resolved paths within the media root. Use the `i` modifier on case-insensitive filesystems.

## File selection and archives
Key: **`selection`**

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `true` | Enables file selection and ZIP archive downloads. |

Set `'selection' => ['enabled' => false]` to disable selection and ZIP downloads. Individual downloads remain available through the context menu and gallery. This does not restrict file access.

## Format
Key: **`format`**

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | String | `Index of %s` | Page title where  `%s` represents the current path.
| `date` | String/Array | `array('d/m/y H:i', 'd/m/y')` | A [PHP date format](https://www.php.net/manual/en/datetime.format.php), or an array of desktop and mobile formats.
| `sizes` | Array | `' B', ' KiB', ' MiB', ' GiB', ' TiB'` | Size formats for when displaying filesizes.

External configs default to `m/d/y H:i` for desktop dates. Set `date` explicitly to choose your format.

## Icon
Key: **`icon`**

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `path` | String/Boolean | `false` | Custom favicon URL. Unset, false or empty uses the embedded default, including in standalone builds.
| `mime` | String | `image/x-icon` | Favicon [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types)

## Sorting
Key: **`sorting`**

Initial sorting settings. A user's saved sort takes precedence.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `false` | Sorts the initial listing. When disabled, the server keeps filesystem enumeration order.
| `order` | Integer | `SORT_ASC` | Sorting order. `SORT_ASC` or `SORT_DESC`.
| `types` | Integer | `0` | What item types to sort.<br/>`0` = Both. `1` = Files only. `2` = Directories only.
| `sort_by` | String | `name` | What to sort by. Available options are `name`, `modified`, `type` and `size`.
| `use_mbstring` | Bool | `false` | Uses [mbstring](https://www.php.net/manual/en/book.mbstring.php) for server-side name sorting. Requires the PHP extension.

## Gallery
Key: **`gallery`**

Displays images and videos from the current directory.

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

Shows an image or video preview when hovering over its filename.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `true` | Whether the preview plugin should be enabled or not.
| `hover_delay` | Integer | `75` | Adds a delay (`ms`) before the preview is displayed.
| `cursor_indicator` | Bool | `true` | Displays a loading cursor while the preview is loading.

## Extensions
Key: **`extensions`**

Extensions eligible for previews and the gallery. Playback depends on browser support.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `image` | Array | `'jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp', 'webp'` | Extensions marked as `image`.
| `video` | Array | `'webm', 'mp4', 'ogv', 'ogg', 'mov'` | Extensions marked as `video`.

## Inject
Key: **`inject`**

Adds HTML such as meta tags or scripts to the page.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `head` | String / Function | `NULL` | Injects the code into the &lt;head&gt; of the document.
| `body` | String / Function | `NULL` | Injects (by prepending) the code into the &lt;body&gt; of the document.
| `footer` | String / Function | `NULL` | Injects (by appending) the code into the &lt;body&gt; of the document.

Callbacks return an HTML string and receive an array with:

- `path`: current URL path.
- `counts`: `files` and `directories` counts.
- `size`: `total` bytes and `readable` size.
- `config`: active configuration.

## Metadata
Key: **`metadata`**

Adds HTML meta tags globally. Use [dotfiles](dotfile.md) for per-directory metadata.

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

Display defaults. Users can change compact mode and themes in the settings menu.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `themes => path` | Bool/String | `/indexer/themes/` | Set to a path relative to the root directory containing `.css` files. Every `.css` file in the set folder will be treated as a separate theme.
| `themes => default` | Bool/String | `false` | Default theme for new clients to use. Takes a filename **without** the `.css` extension.
| `css => additional` | Array/String | `false` | Adds any additional CSS to the page. Can either be a pure CSS `string` or an `array` where the key is the selector and where the child keys and values are properties and values respectively.
| `compact` | Bool | `false` | Makes the page use a more compact and centered style.

## Filter
Key: **`filter`**

Only names matching the regular expression are listed. Directory names include a trailing `/`. Filters do not restrict direct file access.

For example, `/^.{1,10}\.(jpg|png)$/` keeps JPG and PNG files whose name before the extension is 1–10 characters long.

To hide specific names or characters:

 `'/^(?!README\.md$|secret\.pwd$).*$/'`<br/>
This example will hide any `README.md` and `secret.pwd` files from the directory.

 `'/^[^\#\?]*$/'`<br/>
Hides filenames containing `#` or `?`.

Pass an array to combine filters:
```php
'filter' => array(
    'file' => array(
        '/^(?!README\.md$|secret\.pwd$).*$/',
        '/^[^\#\?]*$/'
    ),
    'directory' => false
)
```
A filename must match every expression to remain visible. In this example, the negative expressions hide the named files and filenames containing `#` or `?`.

Setting the value to `false` will disable the filter.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `file` | Bool/String/Array | `false` | A `regexp` filter for what files should be included.
| `directory` | Bool/String/Array | `false` | A `regexp` filter for what directories should be included.

## Exclude
Key: **`exclude`**

Hides files with the listed extensions.

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

Calculates directory sizes. This can slow down listings, especially with recursive scanning.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `false` | Whether directory sizes should be calculated or not.
| `recursive` | Bool | `false` | Recursively scans the directories when calculating the size.

## Footer
Key: **`footer`**

Shows generation time and optional project credits.

| Child key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Bool | `true` | Whether the footer should be displayed or not.

## Other
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `processor` | Bool/Array | `false` | Modify listing data with PHP callbacks. See [processor](processor.md).
| `single_page` | Bool | `false` | Enables navigation between folders without forcing a page reload (experimental).
| `encode_all` | Bool | `false` | Should `?` and `#` characters be encoded when processing URLs and filenames.
| `allow_direct_access` | Bool | `false` | Whether direct access to the `indexer.php` should be allowed or not.
| `path_checking` | String | `strict` | Use `strict` to keep resolved directory paths inside the media root. `weak` also allows symlinks to directories outside it.
| `performance` | Bool/Integer | `250` | Enable [performance mode](performance.md) with `true`, or set a minimum file-and-folder count.
| `credits` | Bool | `true` | Shows the project link and version in the footer.
| `debug` | Bool | `false` | Enables PHP debugging and `console.log()` info messages.

# Advanced
## Server <!-- {docsify-ignore} -->

Set these variables through your web server when the default paths do not fit your deployment.

### Base Path
| Key | Type | Description |
|-----|------|-------------|
| `INDEXER_BASE_PATH` | String | Overrides the default base directory of the script.

Use this when the media directory differs from the script directory. Theme paths resolve against this base and must also be served at their public URLs.

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

Use this when a reverse proxy serves IVFi under a path prefix. The proxy can set `X-Indexer-Prepend-Path` for navigation links.

With Digest authentication, also set `INDEXER_PREPEND_PATH` on the PHP server if the proxy strips the prefix.

Example:
```
location /file/upstream/ {
        proxy_pass http://192.168.1.100:8080/;

        proxy_set_header X-Indexer-Prepend-Path "/file/upstream/";
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

This makes `/image.jpg` link to `/file/upstream/image.jpg`.

Asset URLs are not prefixed; serve or forward `/indexer/` separately.
