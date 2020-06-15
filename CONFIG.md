# Configuration

Here is an overview of what each configurable option does.

These options can be found at the top of the [indexer.php](https://github.com/sixem/eyy-indexer/blob/master/public/indexer.php) file.

## Format
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | String | `Index of %s` | Page title where  `%s` represents the current path.
| `sizes` | Array | `' B', ' kB', ' MB', ' GB', ' TB'` | Size formats for when displaying filesizes.

## Icon
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `path` | String | `/favicon.png` | Path to a favicon.
| `mime` | String | `image/png` | Favicon [MIME type](https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Complete_list_of_MIME_types)

## Sorting
Default sorting settings. Once the user sorts the items themselves, then those settings will be active for them instead.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `false` | Enables a specific sorting order on page-load. If disabled, it'll use the default order used by [scandir](https://www.php.net/manual/en/function.scandir.php).
| `order` | Integer | `SORT_ASC` | Sorting order. `SORT_ASC` or `SORT_DESC`.
| `types` | Integer | `0` | What item types to sort. `0` = Both. `1` = Files only. `2` = Directories only.
| `sort_by` | String | `name` | What to sort by. Available options are `name`, `modified`, `type` and `size`.
| `use_mbstring` | Boolean | `false` | Enables [mbstring](https://www.php.net/manual/en/book.mbstring.php). This will solve some sorting issues with cyrillic capital letters et cetera, but it'll require `mbstring` to be installed.

## Gallery
The gallery plugin will display a gallery of the images and videos inside the current path.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `true` | Whether the gallery plugin should be enabled or not.
| `fade` | Integer | `0` | Fade duration (`ms`) when navigating the gallery. `0` will disable the effect.
| `reverse_options` | Boolean | `true` | Whether gallery images should have a reverse search option or not.
| `scroll_interval` | Integer | `50` | Adds a forced break between scroll events in the gallery (`ms`).

## Preview
The preview plugin displays a preview of the image or video when hovering over the filename.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | Boolean | `true` | Whether the preview plugin should be enabled or not.
| `static` | Boolean | `false` | Whether the preview should follow the cursor or not.
| `hover_delay` | Integer | `75` | Adds a delay (`ms`) before the preview is displayed.
| `window_margin` | Integer | `0` | Forces a `px` margin between the preview and the edges of the viewport.
| `cursor_indicator` | Boolean | `true` | Displays a loading cursor while the preview is loading.

## Extensions
This setting decides which extensions will be marked as `"media"`.

This basically means that the extensions included here will have previews and will be included in the gallery mode.

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `image` | Array | `'jpg', 'jpeg', 'gif', 'png', 'ico', 'svg', 'bmp'` | Extensions marked as `image`.
| `video` | Array | `'webm', 'mp4'` | Extensions marked as `video`.

## Other
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `allow_direct_access` | Boolean | `false` | Whether direct access to the `indexer.php` should be allowed or not.
| `path_checking` | String | `strict` | Use `weak` if you need to support symbolic link directories. `strict` will use [realpath](https://www.php.net/manual/en/function.realpath.php) when verifiying the location of the current directory, whereas `weak` will use a similar string-based approach which doesn't resolve symbolic links.
| `footer` | Boolean | `true` | Whether there should be a simple footer below the list of files or not.
| `debug` | Boolean | `false` | Enables PHP debugging and `console.log` info messages.
