// Desktop right click menu

const desktopMenu = document.getElementById("desktopMenu");

// puts every desktop icon back on the grid, sorted by name

function sortDesktopIcons() {
	const rows = Math.max(1, Math.floor((window.innerHeight - 190) / gridSize));

	desktopShortcuts.sort(function (a, b) {
		const nameA = a.name || (getApp(a.id) || {}).name || "";
		const nameB = b.name || (getApp(b.id) || {}).name || "";

		return nameA.localeCompare(nameB);
	});

	desktopShortcuts.forEach(function (shortcut, index) {
		shortcut.x = gridStartX + Math.floor(index / rows) * gridSize;
		shortcut.y = gridStartY + (index % rows) * gridSize;
	});

	saveApps();

	renderDesktop();
}

function nextWallpaper() {
	const options = Array.from(document.querySelectorAll(".wallpaper-option:not([hidden])"));

	if (options.length === 0) {
		return;
	}

	const current = options.findIndex(function (option) {
		return option.classList.contains("selected");
	});

	options[(current + 1) % options.length].click();
}

document.addEventListener("contextmenu", function (event) {
	// only on the empty desktop

	if (
		event.target.closest(
			".app-window, .explorer-window, .taskbar, .start-menu, .apps-panel, .context-menu, .desktop-icon"
		)
	) {
		return;
	}

	event.preventDefault();

	closeStartMenu();

	hideContextMenu();

	desktopMenu.classList.add("show");

	// keep the menu inside the screen

	const x = Math.min(event.clientX, window.innerWidth - desktopMenu.offsetWidth - 8);

	const y = Math.min(event.clientY, window.innerHeight - desktopMenu.offsetHeight - 8);

	desktopMenu.style.left = x + "px";
	desktopMenu.style.top = y + "px";
});

desktopMenu.querySelectorAll(".context-item").forEach(function (item) {
	item.addEventListener("click", function () {
		const action = item.dataset.action;

		desktopMenu.classList.remove("show");

		if (action === "next-wallpaper") {
			nextWallpaper();
		}

		if (action === "personalize") {
			openApp(document.getElementById("settingsWindow"));

			document.querySelector('.settings-nav[data-page="personalizationPage"]').click();
		}

		if (action === "sort-icons") {
			sortDesktopIcons();
		}

		if (action === "new-note") {
			createStickyNote("");
		}

		if (action === "widgets") {
			openSettingsPage("widgetsPage");
		}

		if (action === "lock") {
			lockScreen();
		}

		if (action === "add-website") {
			launchApp("browstore");

			openWebsiteSheet();
		}

		if (action === "browstore") {
			launchApp("browstore");
		}

		if (action === "task-manager") {
			openTaskManager();
		}

		if (action === "refresh") {
			location.reload();
		}
	});
});

document.addEventListener("pointerdown", function (event) {
	if (!desktopMenu.contains(event.target)) {
		desktopMenu.classList.remove("show");
	}
});

document.addEventListener("keydown", function (event) {
	if (event.key === "Escape") {
		desktopMenu.classList.remove("show");
	}
});
