<?php
return [
    /**
     * Authentication options
     */
    'authentication' => false,
    /**
     * Enables single-page features
     */
    'single_page' => false,
    /** Enables file selection and ZIP archive downloads together */
    'selection' => [
        'enabled' => true
    ],
    /**
     * Formatting options
     */
    'format' => [
        'title' => 'Index of %s', /* Title format where %s is the current path */
        'date' => ['d/m/y H:i', 'd/m/y'], /* Date formats (desktop, mobile) */
        'sizes' => [' B', ' KiB', ' MiB', ' GiB', ' TiB'] /* Size formats */
    ],
    /**
     * Favicon options
     */
    'icon' => [
        'path' => false, /* Custom favicon URL; false uses the embedded default */
        'mime' => 'image/x-icon' /* Favicon mime type */
    ],
    /**
     * Sorting options.
     * 
     * Used as default until the client sets their own sorting settings
     */
    'sorting' => [
        'enabled' => false, /* Whether the server should sort the items */
        'order' => SORT_ASC, /* Sorting order. asc or desc */
        'types' => 0, /* What item types to sort. 0 = both. 1 = files only. 2 = directories only */
        'sort_by' => 'name', /* What to sort by. available options are name, modified, type and size */
        'use_mbstring' => false /* Enabled mbstring when sorting */
    ],
    /**
     * Gallery options
     */
    'gallery' => [
        'enabled' => true, /* Whether the gallery plugin should be enabled */
        'reverse_options' => false, /* Reverse search options for images (when hovering over them) */
        'scroll_interval' => 50, /* Break in ms between scroll navigation events */
        'list_alignment' => 0, /* List alignment where 0 is right and 1 is left */
        'fit_content' => true, /* Whether the media should be forced to fill the screen space */
        'image_sharpen' => false, /* Attempts to disable browser blurriness on images */
    ],
    /**
     * Preview options
     */
    'preview' => [
        'enabled' => true, /* Whether the preview plugin should be enabled */
        'hover_delay' => 75, /* Delay in milliseconds before the preview is shown */
        'cursor_indicator' => true /* Displays a loading cursor while the preview is loading */
    ],
    /**
     * Extension that should be marked as media.
     * These extensions will have potential previews and will be included in the gallery
     */
    'extensions' => [
        'image' => ['jpg', 'jpeg', 'png', 'gif', 'ico', 'svg', 'bmp', 'webp'],
        'video' => ['webm', 'mp4', 'ogg', 'ogv', 'mov']
    ],
    /**
     * Injection options
     */
    'inject' => false,
    /**
     * Styling options
     */
    'style' => [
        /* Set to a path relative to the root directory (location of this file) containg .css files.
         * Each .css file will be treated as a separate theme. Set to false to disable themes */
        'themes' => [
          'path' => '__IVFI_ASSET_PATH__themes/',
          'default' => false
        ],
         /* Cascading style sheets options */
        'css' => [
          'additional' => false
        ],
        /* Enables a more compact styling of the page */
        'compact' => false
    ],
    /**
     * Filter what files or directories to show.

     * Uses regular expressions. All names *matching* the regex will be shown.
     * Setting the value to false will disable the respective filter
     */
    'filter' => [
        'file' => false,
        'directory' => false
    ],
    /** Extensions to exclude */
    'exclude' => false,
    /**
     * Calculates the size of directories.

     * This can be intensive, especially with the recursive
     * option, so be aware of that
     */
    'directory_sizes' => [
      /* Whether directory sizes should be calculated or not */
      'enabled' => false,
      /* Recursively scans the directories when calculating the size */
      'recursive' => false
    ],
    /* Metadata options */
    'metadata' => false,
    /* Processing functions */
    'processor' => false,
    /* Should ? and # characters be encoded when processing URLs */
    'encode_all' => false,
    /* Whether this .php file should be directly accessible */
    'allow_direct_access' => false,
    /* Set to 'strict' or 'weak'.
     * 'strict' uses realpath() to avoid backwards directory traversal
     * whereas 'weak' uses a similar string-based approach */
    'path_checking' => 'strict',
    /* Enable performance mode at this file-and-folder count */
    'performance' => 250,
    /* Whether the footer should be displayed */
    'footer' => [
      'enabled' => true
    ],
    /**
     * Displays a simple link to the git repository in the
     * footer along with the current version.
     * 
     * I would really appreciate it if you would keep this enabled
     */
    'credits' => true,
    /**
     * Enables console output in JS and PHP debugging.
     * Also enables random query-strings for js/css files to bust the cache
     */
    'debug' => false
];
