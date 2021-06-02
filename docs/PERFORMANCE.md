# Performance Mode

The `performance mode` is an experimental option that can be enabled on all or some directories. It can be useful for larger directories where all the DOM elements present can cause browser lag because of long style recalculations and so on.

This is an experimental feature, so it can contain bugs.

### Example

Enable it on all directories.
```php
<?php
return array(
    'performance' => true
);
?>
```

Enable it on all directories with more than 1000 files.
```php
<?php
return array(
    'performance' => 1000
);
?>
```


Disable it completely.
```php
<?php
return array(
    'performance' => false
);
?>
```