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

## Styles

The stylesheet is Tailwind CSS v4, built through PostCSS, with the design tokens of the shadcn preset `bciy3lNA` (zinc base, lime primary, the Geist font). `src/css/index.css` is the only entry and imports the rest:

* `theme.css`: the tokens, light and dark, and the `mobile`, `desktop` and `dark` variants.
* `fonts.css`: Geist Variable, bundled from `src/assets/fonts`.
* `base.css`, `listing.css`, `settings.css`, `gallery.css` and `upload.css`: the page, by area.

The markup keeps its semantic class names, because the scripts, the tests and themes select on them, so the styles apply utilities to those classes with `@apply` rather than putting utility classes in the HTML. No source files are scanned for class names. If markup ever needs a utility class directly, add an `@source` for that file to `index.css`.

The icons are [Lucide](https://lucide.dev) (ISC License), inlined as SVG from `src/core/helpers/icons.ts` and `Helpers::icon()` in the template.

`npm run lint` checks the TypeScript with ESLint and the CSS with Stylelint.

## Testing

The PHP suite runs against the **built** `indexer.php` rather than the webpack
template, so build before testing:

```bash
npm run build
composer install
vendor/bin/phpunit
```

It covers output encoding against a fixture tree of hostile filenames, the
prepend-path header, error handling, path containment, hostile client cookies,
theme discovery, configuration defaults, and the whole sign-in flow. There are
also golden-file snapshots of whole rendered listings.

When a change to the markup is intended, regenerate the snapshots and read the
diff before committing it:

```bash
UPDATE_GOLDEN=1 vendor/bin/phpunit
```

The authentication tests drive the real sign-in flow against PHP's built-in web
server, so they use the session cookie and form token the server actually
issued rather than reconstructing them. That also covers the response status
codes and headers, which the CLI does not emit. No extra binaries are needed.

The suite itself needs PHP 8.4 or newer, because that is PHPUnit 13's floor.
That is a constraint on the tooling, not on the script, which still runs on
older versions.


## Staged TypeScript work

`strict` is not on yet. The flags were measured individually against the current
source on TypeScript 5.9, so the remaining work is a known quantity rather than
a guess:

| Flag | Errors |
|------|--------|
| `strictBindCallApply` | 0, enabled |
| `noImplicitReturns` | 0, enabled |
| `strictFunctionTypes` | 0, enabled |
| `noImplicitThis` | 0, enabled |
| `noImplicitAny` | 0, enabled |
| `strictNullChecks` | 774 |
| `strict` | 795 |

`strict` is TypeScript's umbrella flag, measured on its own. It does not
include `noImplicitReturns`, and it switches on `alwaysStrict`,
`strictPropertyInitialization` and `useUnknownInCatchVariables` as well as the
rows above, so its count is not the sum of them.

`strictNullChecks` could not be measured before the compiler was upgraded,
because TypeScript 4.9, the version the lockfile held, crashed on this source
with an internal `TypeError` in the checker rather than reporting
diagnostics. It is by far the largest item.

`strictNullChecks` is what remains, and the last item on this list.
