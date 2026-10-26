<h1 align="center">Processor</h1>

<br/>

Use `processor.item` to modify listing data before sorting and rendering. The callback receives `$data` and the `$indexer` instance. Return `$data` with its structure and other keys preserved.

`$data['files']` and `$data['directories']` contain item arrays:

| Key | File | Directory |
|---|---|---|
| `0` | Absolute path | Absolute path |
| `1` | Displayed filename | Directory name |
| `name` | Lowercase sorting name, when sorting by name | Same |
| `type` | `[type, extension]`, e.g. `['image', 'jpg']` | `'directory'` |
| `size` | `[bytes, readable size]` | Bytes, or `0` when directory sizes are disabled |
| `modified` | `[timestamp, date HTML]` | Same |
| `url` | File URL | Directory URL |

For example, hide displayed file sizes:

```php
<?php
return [
    'processor' => [
        'item' => function($data) {
            foreach ($data['files'] as $index => $file) {
                $data['files'][$index]['size'][1] = '-';
            }
            return $data;
        }
    ]
];
```
