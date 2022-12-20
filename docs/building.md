<h1 align="center">Building</h1>

<p align="center">Instructions on how to build from source.</p>

<br/>

You can build this script from source using `node` and `npm`.

**Clone repository and install dependencies:**
```bash
git clone https://github.com/sixem/ivfi-php
cd ivfi-php
npm install
```

## Production builds

Build from source, creating minified files:

```bash
npm run build
```

Build a standalone file from source:

```bash
npm run make-standalone
```

This will place the compiled files in a new `build` directory.

## Development builds

Build source mapped, non-production files:

```bash
npm run build-dev
```

## Build Options

You can edit `build.options.json` to enable extra features or change output options:

```json
{
    "extraFeatures": {
        "readmeSupport": false
    },
    "extrasDir": "extras",
    "assetDir": "indexer"
}
```
* `extraFeatures` will enable or disable features when building. For more information see [extras](extras.md).

* `extrasDir` sets the directory where `extras` are located.

* `assetDir` sets the directory where resources (`.js`, `.css` and fonts) will be placed in. This also affects any references in the HTML/CSS.