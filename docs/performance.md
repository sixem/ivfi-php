<h1 align="center">Performance Mode</h1>

Performance mode reduces browser rendering work and is enabled by default for directories with at least 250 files and folders. Set `performance` to `true` for all directories, an item-count threshold, or `false` to disable it.

To raise the threshold to 1,000 items:

```php
<?php
return [
    'performance' => 1000
];
```
