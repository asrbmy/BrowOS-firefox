// New built-in apps
// When a newer BrowOS adds apps, they are installed once. An app that was removed
// is never added back by itself, and the Recycle Bin shortcut appears on the desktop.

(function () {
	// apps from before this list existed were handled by the first run code in apps.js
	const olderBuiltIns = ["notepad", "calculator", "clock", "paint", "browser"];

	let seen = loadList("browos-seen-builtins", null);

	if (seen === null) {
		seen = olderBuiltIns.slice();
	}

	let changed = false;

	appCatalog.forEach(function (app) {
		if (!app.builtIn || seen.includes(app.id)) {
			return;
		}

		seen.push(app.id);

		if (!installedApps.includes(app.id)) {
			installedApps.push(app.id);
		}

		// the Recycle Bin is the only one that also lands on the desktop
		if (app.id === "recyclebin" && !hasShortcut(app.id)) {
			const spot = freeDesktopSpot();

			desktopShortcuts.push({ id: app.id, x: spot.x, y: spot.y, name: null });
		}

		changed = true;
	});

	localStorage.setItem("browos-seen-builtins", JSON.stringify(seen));

	if (changed) {
		saveApps();
	}
})();
