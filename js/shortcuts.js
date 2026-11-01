// Desktop shortcuts

const desktopArea = document.getElementById("desktopArea");

function freeDesktopSpot() {
	const rows = Math.max(1, Math.floor((window.innerHeight - 190) / gridSize));

	for (let column = 0; column < 20; column++) {
		for (let row = 0; row < rows; row++) {
			const x = gridStartX + column * gridSize;
			const y = gridStartY + row * gridSize;

			const taken = desktopShortcuts.some(function (shortcut) {
				return Math.abs(shortcut.x - x) < 10 && Math.abs(shortcut.y - y) < 10;
			});

			if (!taken) {
				return { x: x, y: y };
			}
		}
	}

	return { x: gridStartX, y: gridStartY };
}

function renderDesktop() {
	desktopArea.innerHTML = "";

	desktopShortcuts.forEach(function (shortcut) {
		const app = getApp(shortcut.id);

		if (!app || !isInstalled(shortcut.id)) {
			return;
		}

		const icon = document.createElement("div");

		icon.className = "desktop-icon";

		icon.dataset.app = shortcut.id;

		icon.style.left = shortcut.x + "px";

		icon.style.top = shortcut.y + "px";

		const image = document.createElement("img");

		setIcon(image, app);

		image.alt = app.name;

		const label = document.createElement("span");

		label.textContent = shortcut.name || app.name;

		icon.append(image, label);

		desktopArea.appendChild(icon);

		makeIconDraggable(icon);

		setupRename(icon, label);

		icon.addEventListener("dblclick", function () {
			launchApp(shortcut.id);
		});

		icon.addEventListener("contextmenu", function (event) {
			showAppMenu(event, shortcut.id, icon);
		});
	});
}

// called by the desktop icon dragging code after a drop

function saveDesktopLayout() {
	desktopArea.querySelectorAll(".desktop-icon").forEach(function (icon) {
		const shortcut = desktopShortcuts.find(function (item) {
			return item.id === icon.dataset.app;
		});

		if (shortcut) {
			shortcut.x = parseInt(icon.style.left);
			shortcut.y = parseInt(icon.style.top);
		}
	});

	saveApps();
}

// Rename a desktop shortcut

let nameBeforeRename = "";

function startRename(icon) {
	const label = icon.querySelector("span");

	nameBeforeRename = label.textContent;

	label.contentEditable = "true";

	label.focus();

	// select the whole name like windows does

	const range = document.createRange();

	range.selectNodeContents(label);

	window.getSelection().removeAllRanges();
	window.getSelection().addRange(range);
}

function setupRename(icon, label) {
	label.addEventListener("keydown", function (event) {
		if (event.key === "Enter") {
			event.preventDefault();

			label.blur();
		}

		if (event.key === "Escape") {
			label.textContent = nameBeforeRename;

			label.blur();
		}
	});

	label.addEventListener("blur", function () {
		if (!label.isContentEditable) {
			return;
		}

		label.contentEditable = "false";

		const newName = label.textContent.trim() || nameBeforeRename;

		label.textContent = newName;

		const shortcut = desktopShortcuts.find(function (item) {
			return item.id === icon.dataset.app;
		});

		if (shortcut) {
			shortcut.name = newName;

			saveApps();
		}
	});

	// double click while renaming selects text, it doesn't open the app

	label.addEventListener("dblclick", function (event) {
		if (label.isContentEditable) {
			event.stopPropagation();
		}
	});
}

// Taskbar pins

function renderPins() {
	taskbarPins.forEach(function (id) {
		const app = getApp(id);

		if (!app || !isInstalled(id)) {
			return;
		}

		const appWindow = getAppWindow(app);

		const button = createTaskbarButton(appWindow);

		if (!appWindow.classList.contains("show")) {
			button.classList.remove("active");
		}
	});
}

// right click on a taskbar button

taskbarApps.addEventListener("contextmenu", function (event) {
	const button = event.target.closest(".taskbar-app-button");

	if (button && getApp(button.dataset.taskbarApp)) {
		showAppMenu(event, button.dataset.taskbarApp, null);
	}
});
