<h1 align="center">Themes</h1>

<br/>

Place theme `.css` files in `/indexer/themes/`, then choose a theme from the settings menu. Find themes in [IVFi-themes](https://github.com/sixem/ivfi-themes), or create your own.

To change the folder or default theme, set `style.themes`:

```php
<?php
return [
    'style' => [
        'themes' => [
            'path' => '/indexer/themes/',
            'default' => false
        ]
    ]
];
```

The path is relative to the media root and must also be publicly accessible. For `default`, use the theme's filename without `.css`, or `false` for the built-in appearance. A user's saved choice takes precedence.
