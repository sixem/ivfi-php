<h1 align="center">Dotfile</h1>

Place a JSON file named `.ivfi` in a directory to set metadata and filters for that directory only.

```json
{
    "metadata": [],
    "metadataBehavior": "overwrite",
    "ignore": [],
    "exclude": []
}
```

| Key | Description | Example |
|---|---|---|
| `metadata` | Attributes for HTML meta tags | `[{"name": "description", "content": "My files"}]` |
| `metadataBehavior` | `overwrite` merges metadata, with dotfile values taking priority. `replace` discards all previous metadata, including charset and viewport tags. | `"overwrite"` (default) |
| `ignore` | Hide matching names; supports basic wildcards. Directory names end in `/`. | `["*.md", "image.png", "private/"]` |
| `exclude` | Hide files with these extensions | `["md", "ini"]` |

These filters hide listing entries; they do not block direct downloads.
