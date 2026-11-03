# BrowOS

BrowOS turns your new tab into a little desktop: windows you can drag, a Start menu, a taskbar, apps, wallpapers and a store to add more.

It's a Chrome / Edge extension. No account, no tracking, everything stays in your browser.

Website: https://browos.pages.dev

## What's inside

- Draggable, resizable windows with a taskbar and Start menu
- Built-in apps: Notepad, Calculator, Clock, Paint, Browser, Task Manager
- **BrowStore** to add apps, games and any website
- Wallpapers, accent colors, light/dark mode, window styles, custom cursor
- Sites that can't run inside a window open in their own floating window
- More apps: To-Do, Pomodoro, Weather, Music player, Terminal, Recycle Bin, and the games Snake, Minesweeper and Tetris
- Four virtual desktops, window snapping, and customizable keyboard shortcuts
- Notification center with Do Not Disturb, a system tray with quick settings, and a Start menu search (apps, settings, math, web)
- Desktop widgets (clock, calendar, weather, quote, system) and sticky notes
- Lock screen with an optional PIN (a privacy screen, not real security), screensaver, theme packs
- Export / import all your data as a JSON backup
- **Files**: a file manager (folders, upload, drag to move, trash, search) stored in your browser
- More apps: Calendar with repeats and reminders, Image Viewer, PDF Viewer, Code Editor, Notes (manages your sticky notes), Habits, Budget, Bookmarks, Recorder (voice and screen), and the games Chess, Sudoku, Solitaire and Orb Hop
- Window switcher (hold Alt, press J), Task View (Ctrl + Alt + Up), command palette (Ctrl + Shift + P), clipboard history
- Profiles with separate data and files, optional sync through your browser account, wallpaper slideshow
- A small [SDK](sdk/README.md) so websites in a BrowOS window can show notifications and save files, with permission prompts
- Keyboard focus rings, window roles and names, reduce motion and a high contrast theme pack

## Install (beta)

1. Download the latest `BrowOS.zip` from the [Releases](../../releases) page and unzip it.
2. Open `chrome://extensions` (or `edge://extensions`) and turn on **Developer mode**.
3. Click **Load unpacked** and pick the BrowOS folder.
4. Open a new tab.

Keep the folder where it is after installing. To update, replace the files in the same folder and hit reload on the extensions page. Your settings stay.

## Firefox

`scripts/build.sh` also makes `dist/BrowOS-firefox.zip` with `manifest.firefox.json` (Firefox 115 or newer).
This build has **not been tested in Firefox**. Features that use Chrome-only APIs (separate floating
windows, the memory figure in Task Manager) are expected to be missing there.

## Permissions

`storage` (sync) and `system.memory` (the memory figure in Task Manager). Reading bookmarks is an
**optional** permission that is only asked for when you press the button in the Bookmarks app.

## Project layout

```
index.html        the desktop (new tab page)
manifest.json
css/              one file per part of the desktop
js/               one file per feature, loaded in order from index.html
apps/             bundled apps (one folder each: index.html, app.js, style.css)
sdk/              browos-sdk.js for websites that run in a BrowOS window
tests/            browser checks (see tests/README.md)
scripts/          build.sh makes the Chrome and Firefox packages
icons/  wallpapers/  sounds/  cursors/
```

Run the checks with `cd tests && npm install && npm test`.

Scripts share the page, so the order of the `<script>` tags in `index.html` matters.

## Credits

BrowOS uses some great open-source work:

- Notepad by [Amit Merchant](https://github.com/amitmerchant1990/notepad) (MIT)
- Calculator by [Nikhil Rathor](https://github.com/nikh-tail/CodeAlpha_Task) (MIT)
- Calculator app icon by [Magnific](https://www.magnific.com/icon/calculator_1011863)
- Paint by [ViliusL](https://github.com/viliusle/miniPaint) (MIT)
- "[Starry Night Background](https://opengameart.org/content/starry-night-background)" wallpaper by [Seth Byrd](http://www.sethbyrd.com) (CC0)
- "[Episode 25, page 4](https://www.peppercarrot.com/0_sources/0ther/wallpapers/hi-res/2018-05-22_Episode-25-page-4_by-David-Revoy.jpg)" wallpaper by David Revoy, from the webcomic [Pepper&Carrot](https://www.peppercarrot.com), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- "[Only Komona](https://www.peppercarrot.com/0_sources/0ther/wallpapers/hi-res/2017-04-10_Only-Komona_by-David-Revoy.jpg)" wallpaper by David Revoy, from the webcomic [Pepper&Carrot](https://www.peppercarrot.com), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)
- Weather data by [Open-Meteo.com](https://open-meteo.com) (CC BY 4.0)
- "[Point of View](https://www.davidrevoy.com/article948/point-of-view)" wallpaper by David Revoy, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

Built by [Allysun](https://www.youtube.com/@YourAllyhere).

If you like it, you can [support the project on Ko-fi](https://ko-fi.com/browos).

## License

All code, assets and other content unique to BrowOS is licensed under GPL-3.0. See [LICENSE](LICENSE).

Any content imported from other projects keeps its original license:

- Notepad (`apps/notepad`) is MIT licensed, see [LICENSE.notepad](LICENSE.notepad)
- Calculator (`apps/calculator`) is MIT licensed, see [LICENSE.calculator](LICENSE.calculator)
- Wallpapers by David Revoy are CC BY 4.0, and the Starry Night Background by Seth Byrd is CC0 (see Credits above)
- The Calculator app icon is by Magnific, used under its free license with credit
