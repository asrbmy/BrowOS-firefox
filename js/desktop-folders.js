// Desktop folders
// A folder holds app shortcuts. Drop an icon on a folder to put it inside; open the folder
// to launch, take out, rename or delete. Shortcuts in a folder stay in the shortcut list
// (so uninstalling and the Start menu still work) but are hidden from the desktop.

const FOLDERS_KEY = "browos-desktop-folders";

let desktopFolders = [];

try {
	const savedFolders = JSON.parse(localStorage.getItem(FOLDERS_KEY));

	if (Array.isArray(savedFolders)) {
		desktopFolders = savedFolders.filter(function (folder) {
			return folder && typeof folder.id === "string" && Array.isArray(folder.apps);
		});
	}
} catch (error) {
	desktopFolders = [];
}

function saveFolders() {
	try {
		localStorage.setItem(FOLDERS_KEY, JSON.stringify(desktopFolders));
	} catch (error) {
		// storage is full, the folders just aren't kept
	}
}

function folderedApps() {
	const ids = new Set();

	desktopFolders.forEach(function (folder) {
		folder.apps.forEach(function (id) {
			ids.add(id);
		});
	});

	return ids;
}

function folderById(id) {
	return desktopFolders.find(function (folder) {
		return folder.id === id;
	});
}

function folderFreeSpot() {
	const rows = Math.max(1, Math.floor((window.innerHeight - 190) / gridSize));

	for (let column = 0; column < 20; column++) {
		for (let row = 0; row < rows; row++) {
			const x = gridStartX + column * gridSize;
			const y = gridStartY + row * gridSize;

			const near = function (item) {
				return Math.abs(item.x - x) < 10 && Math.abs(item.y - y) < 10;
			};

			if (!desktopShortcuts.some(near) && !desktopFolders.some(near)) {
				return { x: x, y: y };
			}
		}
	}

	return { x: gridStartX, y: gridStartY };
}

function createFolder(name) {
	const spot = folderFreeSpot();

	const folder = {
		id: "fold" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
		name: name || "New folder",
		x: spot.x,
		y: spot.y,
		apps: [],
	};

	desktopFolders.push(folder);

	saveFolders();

	renderDesktop();

	return folder;
}

function addToFolder(folder, appId) {
	desktopFolders.forEach(function (other) {
		other.apps = other.apps.filter(function (id) {
			return id !== appId;
		});
	});

	folder.apps.push(appId);

	saveFolders();

	renderDesktop();
}

function removeFromFolder(folder, appId) {
	folder.apps = folder.apps.filter(function (id) {
		return id !== appId;
	});

	const shortcut = desktopShortcuts.find(function (item) {
		return item.id === appId;
	});

	if (shortcut) {
		const spot = folderFreeSpot();

		shortcut.x = spot.x;
		shortcut.y = spot.y;

		saveApps();
	}

	saveFolders();

	renderDesktop();
}

function deleteFolder(folder) {
	closeFolderPopup();

	folder.apps.slice().forEach(function (id) {
		removeFromFolder(folder, id);
	});

	desktopFolders = desktopFolders.filter(function (item) {
		return item !== folder;
	});

	saveFolders();

	renderDesktop();
}

function renderFolders() {
	const hidden = folderedApps();

	desktopArea.querySelectorAll(".desktop-icon[data-app]").forEach(function (icon) {
		if (hidden.has(icon.dataset.app)) {
			icon.remove();
		}
	});

	desktopFolders.forEach(function (folder) {
		const icon = document.createElement("div");

		icon.className = "desktop-icon desktop-folder";

		icon.dataset.folder = folder.id;

		icon.tabIndex = 0;

		icon.setAttribute("aria-label", "Folder " + folder.name + ", " + folder.apps.length + " apps");

		icon.style.left = folder.x + "px";

		icon.style.top = folder.y + "px";

		const image = document.createElement("img");

		image.src = "icons/folder-icon.svg";

		image.alt = "";

		const label = document.createElement("span");

		label.textContent = folder.name;

		icon.append(image, label);

		desktopArea.appendChild(icon);

		makeIconDraggable(icon);

		icon.addEventListener("dblclick", function () {
			openFolderPopup(folder, icon);
		});

		icon.addEventListener("keydown", function (event) {
			if (event.key === "Enter") {
				openFolderPopup(folder, icon);
			}
		});

		icon.addEventListener("contextmenu", function (event) {
			event.preventDefault();

			event.stopPropagation();

			openFolderPopup(folder, icon);
		});
	});
}

// put the folder icons back after the desktop is drawn

const renderDesktopWithoutFolders = renderDesktop;

renderDesktop = function () {
	renderDesktopWithoutFolders();

	renderFolders();

	if (folderPopup && !folderById(folderPopup.dataset.folder)) {
		closeFolderPopup();
	}
};

// Sort icons: folders go after the shortcuts that are on the desktop

const sortDesktopIconsWithoutFolders = sortDesktopIcons;

sortDesktopIcons = function () {
	const hidden = folderedApps();

	const inFolders = desktopShortcuts.filter(function (shortcut) {
		return hidden.has(shortcut.id);
	});

	const saved = desktopShortcuts.splice(0, desktopShortcuts.length);

	saved.forEach(function (shortcut) {
		if (!hidden.has(shortcut.id)) {
			desktopShortcuts.push(shortcut);
		}
	});

	const free = desktopShortcuts.length;

	desktopFolders.sort(function (a, b) {
		return a.name.localeCompare(b.name);
	});

	const rows = Math.max(1, Math.floor((window.innerHeight - 190) / gridSize));

	// the original sort lays out the shortcuts that are on the desktop
	sortDesktopIconsWithoutFolders.call(null);

	desktopFolders.forEach(function (folder, index) {
		folder.x = gridStartX + Math.floor((free + index) / rows) * gridSize;
		folder.y = gridStartY + ((free + index) % rows) * gridSize;
	});

	inFolders.forEach(function (shortcut) {
		desktopShortcuts.push(shortcut);
	});

	saveApps();

	saveFolders();

	renderDesktop();
};

// Dropping an icon on a folder

document.addEventListener(
	"pointerup",
	function (event) {
		const icon = event.target.closest ? event.target.closest(".desktop-icon[data-app]") : null;

		if (!icon || !desktopArea.contains(icon)) {
			return;
		}

		const target = document.elementsFromPoint(event.clientX, event.clientY).find(function (element) {
			return element.classList && element.classList.contains("desktop-folder");
		});

		if (target && folderById(target.dataset.folder)) {
			const folder = folderById(target.dataset.folder);

			const appId = icon.dataset.app;

			setTimeout(function () {
				addToFolder(folder, appId);
			}, 0);
		}
	},
	true
);

// remember where folders were dropped (the drag code saves shortcuts only)

desktopArea.addEventListener("pointerup", function () {
	setTimeout(function () {
		desktopArea.querySelectorAll(".desktop-folder").forEach(function (icon) {
			const folder = folderById(icon.dataset.folder);

			if (folder && icon.style.left) {
				folder.x = parseInt(icon.style.left);
				folder.y = parseInt(icon.style.top);
			}
		});

		saveFolders();
	}, 200);
});

// The folder window

let folderPopup = null;

function closeFolderPopup() {
	if (folderPopup) {
		folderPopup.remove();

		folderPopup = null;
	}
}

function openFolderPopup(folder, icon) {
	closeFolderPopup();

	const popup = document.createElement("div");

	popup.className = "folder-popup";

	popup.dataset.folder = folder.id;

	popup.setAttribute("role", "dialog");

	popup.setAttribute("aria-label", "Folder " + folder.name);

	const head = document.createElement("div");

	head.className = "folder-popup-head";

	const name = document.createElement("input");

	name.type = "text";

	name.value = folder.name;

	name.maxLength = 40;

	name.setAttribute("aria-label", "Folder name");

	name.addEventListener("change", function () {
		folder.name = name.value.trim() || "New folder";

		name.value = folder.name;

		saveFolders();

		const label = icon.querySelector("span");

		if (label) {
			label.textContent = folder.name;
		}
	});

	const remove = document.createElement("button");

	remove.textContent = "Delete folder";

	remove.title = "Apps go back to the desktop";

	remove.addEventListener("click", function () {
		deleteFolder(folder);
	});

	head.append(name, remove);

	const grid = document.createElement("div");

	grid.className = "folder-popup-grid";

	const apps = folder.apps.filter(function (id) {
		return getApp(id) && isInstalled(id);
	});

	if (apps.length === 0) {
		const empty = document.createElement("p");

		empty.className = "folder-popup-empty";

		empty.textContent = "Empty. Drag an app icon onto the folder to add it.";

		grid.appendChild(empty);
	}

	apps.forEach(function (id) {
		const app = getApp(id);

		const tile = document.createElement("div");

		tile.className = "folder-tile";

		tile.tabIndex = 0;

		const image = document.createElement("img");

		setIcon(image, app);

		image.alt = "";

		const label = document.createElement("span");

		label.textContent = app.name;

		const out = document.createElement("button");

		out.className = "folder-tile-out";

		out.textContent = "↗";

		out.title = "Move back to the desktop";

		out.setAttribute("aria-label", "Move " + app.name + " back to the desktop");

		out.addEventListener("click", function (event) {
			event.stopPropagation();

			removeFromFolder(folder, id);

			openFolderPopup(folder, desktopArea.querySelector('[data-folder="' + folder.id + '"]') || icon);
		});

		tile.append(image, label, out);

		const open = function () {
			closeFolderPopup();

			launchApp(id);
		};

		tile.addEventListener("click", open);

		tile.addEventListener("keydown", function (event) {
			if (event.key === "Enter") {
				open();
			}
		});

		grid.appendChild(tile);
	});

	popup.append(head, grid);

	document.body.appendChild(popup);

	folderPopup = popup;

	// next to the folder, kept on screen

	const rect = icon.getBoundingClientRect();

	const left = Math.min(Math.max(8, rect.right + 12), window.innerWidth - popup.offsetWidth - 8);

	const top = Math.min(Math.max(8, rect.top), window.innerHeight - popup.offsetHeight - 100);

	popup.style.left = left + "px";

	popup.style.top = Math.max(8, top) + "px";
}

document.addEventListener("pointerdown", function (event) {
	if (folderPopup && !folderPopup.contains(event.target) && !event.target.closest(".desktop-folder")) {
		closeFolderPopup();
	}
});

document.addEventListener("keydown", function (event) {
	if (event.key === "Escape") {
		closeFolderPopup();
	}
});

// New folder in the desktop right-click menu

(function () {
	const item = document.createElement("div");

	item.className = "context-item";

	item.dataset.action = "new-folder";

	item.textContent = "New folder";

	const sort = desktopMenu.querySelector('[data-action="sort-icons"]');

	sort.parentNode.insertBefore(item, sort);

	item.addEventListener("click", function () {
		desktopMenu.classList.remove("show");

		const folder = createFolder("New folder");

		const icon = desktopArea.querySelector('[data-folder="' + folder.id + '"]');

		if (icon) {
			openFolderPopup(folder, icon);

			const input = folderPopup.querySelector("input");

			input.focus();

			input.select();
		}
	});
})();

renderDesktop();
