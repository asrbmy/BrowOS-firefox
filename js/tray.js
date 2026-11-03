// Tray: desktop switcher, notification bell and quick settings

const desktopSwitchButton = document.getElementById("desktopSwitchButton");
const bellButton = document.getElementById("bellButton");
const bellBadge = document.getElementById("bellBadge");
const quickButton = document.getElementById("quickButton");
const quickSettings = document.getElementById("quickSettings");
const desktopsFlyout = document.getElementById("desktopsFlyout");
const desktopTiles = document.getElementById("desktopTiles");

// Flyouts: only one open at a time

function closeFlyouts(except) {
	document.querySelectorAll(".flyout.show").forEach(function (flyout) {
		if (flyout.id !== except) {
			flyout.classList.remove("show");
		}
	});
}

// the flyout sits above the tray button it belongs to

function placeFlyout(flyout, button) {
	const rect = button.getBoundingClientRect();

	const width = flyout.offsetWidth || 320;

	const left = Math.min(
		Math.max(8, rect.right - width),
		window.innerWidth - width - 8
	);

	flyout.style.left = left + "px";
}

function toggleFlyout(flyout, button, beforeOpen) {
	if (flyout.classList.contains("show")) {
		flyout.classList.remove("show");

		return;
	}

	closeFlyouts(flyout.id);

	closeStartMenu();

	if (beforeOpen) {
		beforeOpen();
	}

	flyout.classList.add("show");

	placeFlyout(flyout, button);
}

bellButton.addEventListener("click", function () {
	if (notificationCenter.classList.contains("show")) {
		notificationCenter.classList.remove("show");

		return;
	}

	closeFlyouts("notificationCenter");

	closeStartMenu();

	openNotificationCenter();

	placeFlyout(notificationCenter, bellButton);
});

quickButton.addEventListener("click", function () {
	toggleFlyout(quickSettings, quickButton, syncQuickSettings);
});

desktopSwitchButton.addEventListener("click", function () {
	toggleFlyout(desktopsFlyout, desktopSwitchButton, renderDesktopTiles);
});

// closing: click somewhere else, or Escape

document.addEventListener("pointerdown", function (event) {
	if (!event.target.closest(".flyout, .tray-button")) {
		closeFlyouts();
	}
});

document.addEventListener("keydown", function (event) {
	if (event.key === "Escape") {
		closeFlyouts();
	}
});

// the start menu closes the flyouts too

startButton.addEventListener("click", function () {
	closeFlyouts();
});

// Bell badge

function updateBadge() {
	const count = unreadCount();

	bellBadge.hidden = count === 0;

	bellBadge.textContent = count > 9 ? "9+" : String(count);

	bellButton.title = count ? count + " unread notifications" : "Notifications";

	bellButton.classList.toggle("quiet", doNotDisturb());
}

document.addEventListener("notifications-changed", updateBadge);
document.addEventListener("dnd-changed", updateBadge);

updateBadge();

// Quick settings

const qsDark = document.getElementById("qsDark");
const qsDnd = document.getElementById("qsDnd");
const qsSounds = document.getElementById("qsSounds");
const qsVolume = document.getElementById("qsVolume");

function syncQuickSettings() {
	qsDark.checked = document.documentElement.classList.contains("light-mode") === false;

	qsDnd.checked = doNotDisturb();

	qsSounds.checked = uiSoundsOn();

	qsVolume.value = localStorage.getItem("volume") || 70;
}

qsDark.addEventListener("change", function () {
	themeSelect.value = qsDark.checked ? "dark" : "light";

	themeSelect.dispatchEvent(new Event("change"));
});

qsDnd.addEventListener("change", function () {
	setDoNotDisturb(qsDnd.checked);
});

qsSounds.addEventListener("change", function () {
	localStorage.setItem("browos-ui-sounds", qsSounds.checked ? "on" : "off");

	document.dispatchEvent(new Event("ui-sounds-changed"));
});

// same volume as the Startup settings

qsVolume.addEventListener("input", function () {
	volumeSlider.value = qsVolume.value;

	volumeSlider.dispatchEvent(new Event("input"));
});

document.getElementById("qsLock").addEventListener("click", function () {
	closeFlyouts();

	lockScreen();
});

document.getElementById("qsSaver").addEventListener("click", function () {
	closeFlyouts();

	startScreensaver();
});

document.getElementById("qsWallpaper").addEventListener("click", function () {
	nextWallpaper();
});

document.getElementById("qsSettings").addEventListener("click", function () {
	closeFlyouts();

	openApp(settingsWindow);
});

// Desktop tiles in the switcher

function renderDesktopTiles() {
	desktopTiles.innerHTML = "";

	for (let number = 1; number <= DESKTOP_COUNT; number++) {
		const tile = document.createElement("div");

		tile.className = "desktop-tile" + (number === currentDesktop ? " current" : "");

		const main = document.createElement("button");

		main.className = "desktop-tile-main";

		const name = document.createElement("span");

		name.className = "desktop-tile-name";
		name.textContent = "Desktop " + number;

		const icons = document.createElement("span");

		icons.className = "desktop-tile-icons";

		const windows = windowsOnDesktop(number);

		windows.slice(0, 6).forEach(function (appWindow) {
			const icon = document.createElement("img");

			icon.src = appWindow.dataset.appIcon;
			icon.alt = appWindow.dataset.appName;
			icon.title = appWindow.dataset.appName;

			icons.appendChild(icon);
		});

		if (windows.length === 0) {
			icons.textContent = "Empty";

			icons.className += " empty";
		}

		main.append(name, icons);

		main.addEventListener("click", function () {
			switchDesktop(number);

			desktopsFlyout.classList.remove("show");
		});

		tile.appendChild(main);

		if (number !== currentDesktop) {
			const move = document.createElement("button");

			move.className = "desktop-tile-move";
			move.textContent = "Move window here";
			move.title = "Move the window in front to this desktop";

			move.addEventListener("click", function () {
				const target = frontWindow();

				if (target) {
					moveWindowToDesktop(target, number, false);

					renderDesktopTiles();
				}
			});

			tile.appendChild(move);
		}

		desktopTiles.appendChild(tile);
	}
}

document.addEventListener("desktops-changed", function () {
	desktopSwitchButton.textContent = String(currentDesktop);

	if (desktopsFlyout.classList.contains("show")) {
		renderDesktopTiles();
	}
});

desktopSwitchButton.textContent = String(currentDesktop);
