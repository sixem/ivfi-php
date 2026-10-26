<h1 align="center">Performance Mode</h1>

Performance mode reduces browser rendering work in large directories. Set `performance` to `true` for all directories, an item-count threshold, or `false` to disable it.

For directories with at least 1,000 files and folders:

```php
<?php
return [
    'performance' => 1000
];
```
