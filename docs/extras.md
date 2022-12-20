<h1 align="center">Extra Features</h1>

<br/>

The `extras` directory contains extra features for the Indexer.

These features must be compiled independently, as they are not available in any official releases.

To build the Indexer with these features, find and edit [build.options.json](https://github.com/sixem/ivfi-php/blob/master/build.options.json) in the base directory of the repository.

Simply set the value of any corresponding key under `extraFeatures` to `true` or `false` to enable and disable the feature respectively during compilation.

These features are still experimental, and how they are used and implemented may therefore change in the future.

## Features <!-- {docsify-ignore} -->

### 📄 readmeSupport (_support for `README.md` files_)

This feature will display any `README.md` files on top of the page. 

This can be useful if you want to show any information on what the folder contains and so on.

The file should contain Markdown/HTML data, and it is parsed on load using [Parsedown](https://github.com/erusev/parsedown).