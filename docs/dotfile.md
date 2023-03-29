<h1 align="center">Dotfile</h1>

<br/>

If a directory contains an `.ivfi` dotfile, the script will read the options from the file and enable those settings for that directory only.

The script expects the file to be in a JSON format, like this template:
```json
{
    "metadata": [],
    "metadataBehavior": "overwrite",
    "ignore": [],
    "exclude": []
}
```
### metadata
An array of objects containg the attributes (keys) and values for the metadata elements.

* Example: ```[ { "property": "description", "content": "A description." } ]```
* type: `<array>`

---

### metadataBehavior
Sets the override behavior of the metadata options. If using `overwrite` it'll override any existing values should they already exist, but keep any existing, unchanged values. Using `replace` will simply remove all previous metadata in favor of the new data, this also applies to any `charset` or `viewport` metadata set by the script.

*The dotfile metadata will always take priority over the configuration values when using overwrite.*

* default: `overwrite`
* type: `'string'`

---

### ignore
An array of strings that will act as a filter for the current file data. Directories will always end in a `/` for easier identification. Any files or directories matching an item in this array will be hidden. It supports basic wildcards.

* Example: ```[ "*.md", "image.png", "directory/"]```
* type: `<array>`

---

### exclude
An array of strings that will act in a similar way as the ignore option, however, this will only apply to extensions, so any files matching the extensions that are in this array will be hidden.

* Example: ```[ "md", "ini" ]```
* type: `<array>`
