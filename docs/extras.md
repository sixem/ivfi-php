<h1 align="center">Extra Features</h1>

Optional features are disabled in standard builds. Enable them under `extraFeatures` in [build.options.json](../build.options.json), then [rebuild](building.md). Both regular and standalone builds support them.

## README support

Set `readmeSupport` to `true` to display a directory's `README.md` above its listing. Requires PHP `mbstring`.

[Parsedown](https://github.com/erusev/parsedown) renders Markdown in safe mode: raw HTML is displayed as text and unsafe links are blocked.

Unreadable files and files over 1 MiB are skipped. Without `mbstring`, listings still work but README previews are omitted.
