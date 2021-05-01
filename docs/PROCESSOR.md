# Processor

The `processor` option can be used if you want to alter some of the data used by the indexer. You can pass functions through the configuration and modify the data before it is being utilized by the indexer.

These functions will be called by the indexer and the relevant arguments will be passed to them. If a function is passed, the indexer expects the handled `$data` to be returned in the same way that it was passed (intact structure/keys).

## Item
Key: `processor {array} => item {function}`

Passed arguments: `($data {array}[directories|files], $indexer {class instance})`

### `$data`
An example of a `$data['files']` item:
```php
array(7) {
  [0]=>
  string(41) "/var/www/server/public/master/POWER.jpg" // absolute path of item.
  [1]=>
  string(9) "POWER.jpg" // rendered filename.
  ["name"]=>
  string(9) "power.jpg" // used for server-side sorting only (if sorted by name).
  ["type"]=>
  array(2) {
    [0]=>
    string(5) "image" // type of file.
    [1]=>
    string(3) "jpg" // file extension.
  }
  ["size"]=>
  array(2) {
    [0]=>
    int(129923) // raw file size. used to sort items by size.
    [1]=>
    string(6) "127 kB" // readable file size.
  }
  ["modified"]=>
  array(2) {
    [0]=>
    int(1617952924) // raw modification data. used to sort items by date.
    [1]=>
    string(90) "<span data-view=\"desktop\">04/09/21 09:22:04</span><span data-view=\"mobile\">09/04/21</span>" // html string for showing modified date.
  }
  ["url"]=>
  string(17) "/master/POWER.jpg" // url to the item.
}
```

An example of a `$data['directories']` item:
```php
array(6) {
  [0]=>
  string(41) "/var/www/server/public/master/subfolder" // absolute path of directory.
  [1]=>
  string(9) "subfolder" // directory name.
  ["modified"]=>
  array(2) {
    [0]=>
    int(1619271520) // raw modification data. used to sort items by date.
    [1]=>
    string(90) "<span data-view="desktop">04/24/21 15:38:40</span><span data-view="mobile">24/04/21</span>" // html string for showing modified date.
  }
  ["type"]=>
  string(9) "directory" // item type.
  ["size"]=>
  int(8650942) // directory size. only relevant if directory_sizes is enabled.
  ["url"]=>
  string(17) "/master/subfolder" // url to the directory.
}
```
## Example

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
                $file['url'] = (sprintf('%s?width=800&auth=true', $file['url']));

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