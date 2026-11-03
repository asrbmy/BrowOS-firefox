// Command palette (Ctrl + Shift + P)
// One box that runs any action: open or close apps, switch windows, settings pages,
// desktops, shortcuts and the commands that apps add with browosApi.registerCommand.

const appCommands = {};

function paletteCommands() {
	const list = [];

	function add(name, kind, run, words, keys) {
		list.push({ name: name, kind: kind, run: run, words: (words || "").toLowerCase(), keys: keys || "" });
	}

	window.browosApi.listApps().forEach(function (app) {
		add("Open " + app.name, "App", function () {
			launchApp(app.id);
		}, app.id);
	});

	switchableWindows().forEach(function (appWindow) {
		add("Switch to " + appWindow.dataset.appName, "Window", function () {
			focusWindow(appWindow);
		});

		add("Close " + appWindow.dataset.appName, "Window", function () {
			closeApp(appWindow);
		});
	});

	quickActions.forEach(function (action) {
		add(action.name, "Action", action.run, action.words);
	});

	settingsTargets.forEach(function (target) {
		add("Settings: " + target.name, "Settings", function () {
			openSettingsPage(target.page);
		}, target.words);
	});

	hotkeyActions.forEach(function (action) {
		const combo = comboFor(action);

		add(action.label, "Shortcut", action.run, action.id, combo ? prettyCombo(combo) : "");
	});

	for (let number = 1; number <= DESKTOP_COUNT; number++) {
		add("Go to desktop " + number, "Desktop", function () {
			switchDesktop(number);
		}, "virtual workspace");

		add("Move window to desktop " + number, "Desktop", function () {
			const target = frontWindow();

			if (target) {
				moveWindowToDesktop(target, number, true);
			}
		}, "virtual workspace");
	}

	add("Show the BrowOS tour", "Action", function () {
		startTour();
	}, "help welcome guide");

	add("Show clipboard history", "Action", function () {
		openClipboardHistory();
	}, "copy paste");

	add("Clear clipboard history", "Action", function () {
		clearClipboardHistory();
	}, "copy paste forget");

	const runningIds = switchableWindows().map(function (appWindow) {
		return appWindow.dataset.appId;
	});

	Object.keys(appCommands).forEach(function (key) {
		const command = appCommands[key];

		if (runningIds.includes(command.app)) {
			add(command.name, command.appName || "App", command.run);
		}
	});

	return list;
}

const paletteEl = document.createElement("div");

paletteEl.className = "overlay palette";
paletteEl.id = "palette";
paletteEl.setAttribute("role", "dialog");
paletteEl.setAttribute("aria-label", "Command palette");

paletteEl.innerHTML =
	'<div class="palette-box"><input class="palette-input" id="paletteInput" type="text" placeholder="Type a command..." autocomplete="off" aria-label="Command"><div class="palette-list" id="paletteList" role="listbox"></div></div>';

document.body.appendChild(paletteEl);

const paletteInput = document.getElementById("paletteInput");
const paletteList = document.getElementById("paletteList");

let paletteItems = [];
let paletteShown = [];
let paletteIndex = 0;

function paletteOpen() {
	return paletteEl.classList.contains("show");
}

function scoreCommand(command, words) {
	const hay = (command.name + " " + command.words + " " + command.kind).toLowerCase();

	let score = 0;

	for (const word of words) {
		if (!hay.includes(word)) {
			return -1;
		}

		score += command.name.toLowerCase().startsWith(word) ? 3 : command.name.toLowerCase().includes(word) ? 2 : 1;
	}

	return score;
}

function drawPalette() {
	const words = paletteInput.value.toLowerCase().split(/\s+/).filter(Boolean);

	paletteShown = paletteItems
		.map(function (command) {
			return { command: command, score: words.length ? scoreCommand(command, words) : 0 };
		})
		.filter(function (item) {
			return item.score >= 0;
		})
		.sort(function (a, b) {
			return b.score - a.score;
		})
		.slice(0, 40)
		.map(function (item) {
			return item.command;
		});

	paletteIndex = Math.min(paletteIndex, Math.max(0, paletteShown.length - 1));

	paletteList.innerHTML = "";

	if (paletteShown.length === 0) {
		const empty = document.createElement("div");

		empty.className = "palette-empty";
		empty.textContent = "No commands match.";

		paletteList.appendChild(empty);

		return;
	}

	paletteShown.forEach(function (command, index) {
		const row = document.createElement("div");

		row.className = "palette-row" + (index === paletteIndex ? " selected" : "");
		row.setAttribute("role", "option");

		const name = document.createElement("span");

		name.textContent = command.name;

		const kind = document.createElement("span");

		kind.className = "kind";
		kind.textContent = command.keys || command.kind;

		row.append(name, kind);

		row.addEventListener("click", function () {
			runPalette(command);
		});

		row.addEventListener("pointermove", function () {
			if (paletteIndex !== index) {
				paletteIndex = index;

				paletteList.querySelectorAll(".palette-row").forEach(function (other, position) {
					other.classList.toggle("selected", position === index);
				});
			}
		});

		paletteList.appendChild(row);
	});
}

function openPalette() {
	closeFlyouts();

	closeStartMenu();

	paletteItems = paletteCommands();

	paletteInput.value = "";

	paletteIndex = 0;

	drawPalette();

	paletteEl.classList.add("show");

	paletteInput.focus();
}

function closePalette() {
	paletteEl.classList.remove("show");
}

function runPalette(command) {
	closePalette();

	// the overlay is gone before the command runs, so it can open its own overlays
	setTimeout(function () {
		command.run();
	}, 0);
}

paletteInput.addEventListener("input", function () {
	paletteIndex = 0;

	drawPalette();
});

paletteInput.addEventListener("keydown", function (event) {
	if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		event.preventDefault();

		if (paletteShown.length) {
			paletteIndex = (paletteIndex + (event.key === "ArrowDown" ? 1 : -1) + paletteShown.length) % paletteShown.length;

			drawPalette();

			const selected = paletteList.querySelector(".palette-row.selected");

			if (selected) {
				selected.scrollIntoView({ block: "nearest" });
			}
		}
	} else if (event.key === "Enter") {
		event.preventDefault();

		if (paletteShown[paletteIndex]) {
			runPalette(paletteShown[paletteIndex]);
		}
	} else if (event.key === "Escape") {
		event.preventDefault();
		event.stopPropagation();

		closePalette();
	}
});

paletteEl.addEventListener("pointerdown", function (event) {
	if (event.target === paletteEl) {
		closePalette();
	}
});

window.browosApi.registerCommand = function (appId, name, run) {
	const app = getApp(appId);

	appCommands[appId + ":" + name] = {
		app: appId,
		appName: app ? app.name : appId,
		name: name,
		run: run,
	};
};

window.browosApi.openPalette = openPalette;

hotkeyActions.push({ id: "palette", label: "Command palette", combo: "ctrl+shift+p", run: function () { paletteOpen() ? closePalette() : openPalette(); } });

renderHotkeyList();
