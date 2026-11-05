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
| `size` | `[bytes, readable size]` | Bytes, `null` when unknown, or `0` when disabled |
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

Set `directory_sizes.enabled` to `true` and `directory_sizes.source` to `processor` to skip scans. Supply non-negative integer bytes in each directory’s `size`; `null` displays as “–”, while `0` means empty. Unknown sizes sort last and make the total unknown.
