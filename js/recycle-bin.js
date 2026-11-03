// Recycle Bin
// Apps removed from BrowOS are kept here until they are restored or deleted for good.

const BIN_KEY = "browos-bin";
const MAX_BIN_ITEMS = 100;

let binItems = loadList(BIN_KEY, []).filter(function (item) {
	return item && typeof item.id === "string";
});

function saveBin() {
	try {
		localStorage.setItem(BIN_KEY, JSON.stringify(binItems));
	} catch (error) {
		// storage is full: the bin just isn't remembered
	}

	document.dispatchEvent(new Event("bin-changed"));
}

// called by removeApp() before it takes the app apart
function binRecord(id) {
	const app = getApp(id);

	if (!app) {
		return;
	}

	const shortcut = desktopShortcuts.find(function (item) {
		return item.id === id;
	});

	const site = customSites.find(function (item) {
		return item.id === id;
	});

	binItems = binItems.filter(function (item) {
		return item.id !== id;
	});

	binItems.unshift({
		id: id,
		name: (shortcut && shortcut.name) || app.name,
		icon: app.icon,
		custom: Boolean(app.custom),
		site: site ? JSON.parse(JSON.stringify(site)) : null,
		shortcut: shortcut ? JSON.parse(JSON.stringify(shortcut)) : null,
		pinned: isPinned(id),
		removedAt: Date.now(),
	});

	binItems = binItems.slice(0, MAX_BIN_ITEMS);

	saveBin();
}

function binRestore(id) {
	const item = binItems.find(function (other) {
		return other.id === id;
	});

	if (!item) {
		return false;
	}

	// a website lives only in the bin item
	if (item.site && !customSites.some(function (site) { return site.id === id; })) {
		customSites.push(item.site);
	}

	if (!installedApps.includes(id)) {
		installedApps.push(id);
	}

	if (item.shortcut && !hasShortcut(id)) {
		const shortcut = item.shortcut;

		const taken = desktopShortcuts.some(function (other) {
			return Math.abs(other.x - shortcut.x) < 10 && Math.abs(other.y - shortcut.y) < 10;
		});

		if (taken) {
			const spot = freeDesktopSpot();

			shortcut.x = spot.x;
			shortcut.y = spot.y;
		}

		desktopShortcuts.push(shortcut);
	}

	if (item.pinned && !isPinned(id)) {
		taskbarPins.push(id);
	}

	binItems = binItems.filter(function (other) {
		return other.id !== id;
	});

	saveBin();

	appsChanged();

	renderPins();

	return true;
}

function binDelete(id) {
	binItems = binItems.filter(function (item) {
		return item.id !== id;
	});

	saveBin();
}

function binEmpty() {
	binItems = [];

	saveBin();
}
