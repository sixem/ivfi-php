# Processor

The `processor` option can be used if you want to alter some of the data used by the indexer. You can pass functions through the configuration and modify the data before it is being utilized by the indexer.

These functions will be called by the indexer and the relevant arguments will be passed to them. If a function is passed, the indexer expects the handled `$data` to be returned in the same way that it was passed (intact structure/keys).

## Item
Key: `config => processor {array} => item {function}`

Passed arguments: `($data {array}[directories|files], $indexer {class instance})`

### `$data`
An example of a `$data['files']` item:
```php
array(7) {
  [0]=>
  string(41) "/var/www/server/public/master/IMAGE.jpg" // Absolute path of item.
  [1]=>
  string(9) "IMAGE.jpg" // Rendered filename.
  ["name"]=>
  string(9) "image.jpg" // Used for server-side sorting only (if sorted by name).
  ["type"]=>
  array(2) {
    [0]=>
    string(5) "image" // Type of file.
    [1]=>
    string(3) "jpg" // File extension.
  }
  ["size"]=>
  array(2) {
    [0]=>
    int(129923) // Raw file size. Used to sort items by size.
    [1]=>
    string(6) "127 kB" // Readable file size.
  }
  ["modified"]=>
  array(2) {
    [0]=>
    int(1617952924) // Raw modification data. used to sort items by date.
    [1]=>
    string(90) "<span data-view=\"desktop\">04/09/21 09:22:04</span><span data-view=\"mobile\">09/04/21</span>" // HTML string for showing modified date.
  }
  ["url"]=>
  string(17) "/master/IMAGE.jpg" // URL to the item.
}
```

An example of a `$data['directories']` item:
```php
array(6) {
  [0]=>
  string(41) "/var/www/server/public/master/subfolder" // Absolute path of directory.
  [1]=>
  string(9) "subfolder" // Directory name.
  ["modified"]=>
  array(2) {
    [0]=>
    int(1619271520) // Raw modification data. Used to sort items by date.
    [1]=>
    string(90) "<span data-view=\"desktop\">04/24/21 15:38:40</span><span data-view=\"mobile\">24/04/21</span>" // HTML string for showing modified date.
  }
  ["type"]=>
  string(9) "directory" // Item type.
  ["size"]=>
  int(8650942) // Directory size. Only relevant if directory_sizes is enabled.
  ["url"]=>
  string(17) "/master/subfolder" // URL to the directory.
}
```
### Example

Finally, an example of how this can be used in a configuration file:
```php
<?php
return array(
    'processor' => array(
        'item' => function($data)
        {
            foreach($data['files'] as $index => $file)
            {
                // Adds some query strings to the URL of the files.
                $file['url'] = (sprintf('%s?width=800&key=1', $file['url']));

                // Hides the filesize.
                $file['size'][0] = 0;
                $file['size'][1] = '-';

                // Apply changes to array.
                $data['files'][$index] = $file;
            }
            
            return $data;
        }
    )
);
?>
```