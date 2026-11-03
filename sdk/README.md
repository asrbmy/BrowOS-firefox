# BrowOS SDK

For websites that people add to BrowOS from BrowStore. The page runs in a window inside BrowOS and
can use a few desktop features through `postMessage`. Add `browos-sdk.js` to your page:

```html
<script src="browos-sdk.js"></script>
<script>
  BrowOS.ready.then(info => document.body.dataset.theme = info.theme);
  BrowOS.notify("Export finished", "Your file is ready");
  BrowOS.files.write("notes.txt", "hello").then(name => console.log("saved as", name));
</script>
```

| Call | Needs permission | What it does |
| --- | --- | --- |
| `BrowOS.ready` | no | `{ version, theme, accent, features }` |
| `BrowOS.notify(title, message)` | notify | shows a BrowOS notification |
| `BrowOS.openApp(name)` | openApp | opens another app, resolves with its name or `null` |
| `BrowOS.keepAwake(on)` | keepAwake | stops the lock screen and screensaver while `on` |
| `BrowOS.files.write(name, text)` | files | saves a text file in **Files / Apps / your app** |
| `BrowOS.files.read(name)` | files | the text of a file in that folder, or `null` |
| `BrowOS.files.list()` | files | names of the files in that folder |

The first time an app uses a feature BrowOS asks the person. The answer is remembered and can be
changed in **Settings > System > App permissions**. An app can only reach its own folder in Files.
Outside BrowOS `BrowOS.available` is `false` and every call rejects, so the page can fall back.
