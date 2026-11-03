// Keyboard shortcuts
// Every action has a default key combination that can be changed in Settings > Shortcuts.
// They work on the desktop and inside the apps that come with BrowOS. A website that is
// shown in a window belongs to another origin and keeps its keys to itself.

const HOTKEYS_KEY = "browos-hotkeys";

const hotkeyActions = [
	{
		id: "search",
		label: "Search apps, settings and the web",
		combo: "ctrl+k",
		run: function () {
			openStartSearch();
		},
	},
	{
		id: "lock",
		label: "Lock the screen",
		combo: "ctrl+alt+l",
		run: function () {
			lockScreen();
		},
	},
	{
		id: "newNote",
		label: "New sticky note",
		combo: "ctrl+alt+n",
		run: function () {
			createStickyNote("");
		},
	},
	{
		id: "desktopPrevious",
		label: "Previous virtual desktop",
		combo: "ctrl+alt+arrowleft",
		run: function () {
			switchDesktop(currentDesktop - 1);
		},
	},
	{
		id: "desktopNext",
		label: "Next virtual desktop",
		combo: "ctrl+alt+arrowright",
		run: function () {
			switchDesktop(currentDesktop + 1);
		},
	},
	{
		id: "moveWindowPrevious",
		label: "Move window to the previous desktop",
		combo: "ctrl+alt+shift+arrowleft",
		run: function () {
			const target = frontWindow();

			if (target && currentDesktop > 1) {
				moveWindowToDesktop(target, currentDesktop - 1, true);
			}
		},
	},
	{
		id: "moveWindowNext",
		label: "Move window to the next desktop",
		combo: "ctrl+alt+shift+arrowright",
		run: function () {
			const target = frontWindow();

			if (target && currentDesktop < DESKTOP_COUNT) {
				moveWindowToDesktop(target, currentDesktop + 1, true);
			}
		},
	},
	{
		id: "snapLeft",
		label: "Snap window to the left half",
		combo: "alt+shift+arrowleft",
		run: function () {
			const target = frontWindow();

			if (target) {
				snapWindow(target, "left");
			}
		},
	},
	{
		id: "snapRight",
		label: "Snap window to the right half",
		combo: "alt+shift+arrowright",
		run: function () {
			const target = frontWindow();

			if (target) {
				snapWindow(target, "right");
			}
		},
	},
	{
		id: "snapMaximize",
		label: "Maximize window",
		combo: "alt+shift+arrowup",
		run: function () {
			const target = frontWindow();

			if (target) {
				snapWindow(target, "max");
			}
		},
	},
	{
		id: "snapRestore",
		label: "Restore window size",
		combo: "alt+shift+arrowdown",
		run: function () {
			const target = frontWindow();

			if (target) {
				snapWindow(target, "restore");
			}
		},
	},
	{
		id: "closeWindow",
		label: "Close the window in front",
		combo: "alt+shift+q",
		run: function () {
			const target = frontWindow();

			if (target) {
				closeApp(target);
			}
		},
	},
];

const fixedHotkeys = [
	["Shift + Esc", "Open the Task Manager"],
	["Esc", "Close menus and panels"],
	["Double-click a title bar", "Maximize or restore a window"],
	["Drag a window to the left or right edge", "Snap it to half of the screen"],
	["Drag a window to the top edge", "Maximize it"],
];

let customHotkeys = {};

try {
	customHotkeys = JSON.parse(localStorage.getItem(HOTKEYS_KEY)) || {};
} catch (error) {
	customHotkeys = {};
}

function comboFor(action) {
	return Object.prototype.hasOwnProperty.call(customHotkeys, action.id)
		? customHotkeys[action.id]
		: action.combo;
}

function comboOf(event) {
	let key;

	// the physical key, so Alt + letter works on every keyboard layout
	if (event.code && event.code.startsWith("Key")) {
		key = event.code.slice(3).toLowerCase();
	} else if (event.code && event.code.startsWith("Digit")) {
		key = event.code.slice(5);
	} else {
		key = String(event.key || "").toLowerCase();
	}

	if (key === " ") {
		key = "space";
	}

	if (!key || ["control", "alt", "shift", "meta", "dead", "unidentified"].includes(key)) {
		return null;
	}

	const parts = [];

	if (event.ctrlKey) {
		parts.push("ctrl");
	}

	if (event.altKey) {
		parts.push("alt");
	}

	if (event.shiftKey) {
		parts.push("shift");
	}

	if (event.metaKey) {
		parts.push("meta");
	}

	parts.push(key);

	return parts.join("+");
}

const prettyKeys = {
	ctrl: "Ctrl",
	alt: "Alt",
	shift: "Shift",
	meta: "Meta",
	arrowleft: "←",
	arrowright: "→",
	arrowup: "↑",
	arrowdown: "↓",
	space: "Space",
	escape: "Esc",
};

function prettyCombo(combo) {
	if (!combo) {
		return "Not set";
	}

	return combo
		.split("+")
		.map(function (part) {
			return prettyKeys[part] || (part.length === 1 ? part.toUpperCase() : part.toUpperCase());
		})
		.join(" + ");
}

// Running them

let capturingHotkey = null;

function typingIn(target) {
	return Boolean(target && target.closest && target.closest("input, textarea, select, [contenteditable='true']"));
}

onEveryDocument(function (doc) {
	doc.addEventListener(
		"keydown",
		function (event) {
			if (capturingHotkey || locked || event.repeat) {
				return;
			}

			const combo = comboOf(event);

			if (!combo) {
				return;
			}

			const action = hotkeyActions.find(function (item) {
				return comboFor(item) === combo;
			});

			if (!action) {
				return;
			}

			// a key without Ctrl, Alt or Meta would break typing in text fields
			if (!(event.ctrlKey || event.altKey || event.metaKey) && typingIn(event.target)) {
				return;
			}

			event.preventDefault();

			event.stopPropagation();

			action.run();
		},
		true
	);
});

// Settings: Shortcuts page

const hotkeyList = document.getElementById("hotkeyList");
const hotkeyMessage = document.getElementById("hotkeyMessage");

function saveHotkeys() {
	localStorage.setItem(HOTKEYS_KEY, JSON.stringify(customHotkeys));
}

function renderHotkeyList() {
	hotkeyList.innerHTML = "";

	hotkeyActions.forEach(function (action) {
		const row = document.createElement("div");

		row.className = "setting-row hotkey-row";

		const label = document.createElement("span");

		label.textContent = action.label;

		const button = document.createElement("button");

		button.className = "hotkey-button";
		button.textContent = prettyCombo(comboFor(action));
		button.title = "Click, then press the new keys. Backspace clears it, Esc cancels.";

		button.addEventListener("click", function () {
			if (capturingHotkey) {
				capturingHotkey.button.textContent = prettyCombo(comboFor(capturingHotkey.action));
			}

			capturingHotkey = { action: action, button: button };

			button.textContent = "Press the keys...";

			hotkeyMessage.textContent = "";
		});

		row.append(label, button);

		hotkeyList.appendChild(row);
	});

	fixedHotkeys.forEach(function (item) {
		const row = document.createElement("div");

		row.className = "setting-row hotkey-row fixed";

		const label = document.createElement("span");

		label.textContent = item[1];

		const keys = document.createElement("span");

		keys.className = "hotkey-fixed";
		keys.textContent = item[0];

		row.append(label, keys);

		hotkeyList.appendChild(row);
	});
}

document.addEventListener(
	"keydown",
	function (event) {
		if (!capturingHotkey) {
			return;
		}

		event.preventDefault();

		event.stopPropagation();

		const current = capturingHotkey;

		function finish() {
			capturingHotkey = null;

			renderHotkeyList();
		}

		if (event.key === "Escape") {
			finish();

			return;
		}

		if (event.key === "Backspace" || event.key === "Delete") {
			customHotkeys[current.action.id] = "";

			saveHotkeys();

			finish();

			return;
		}

		const combo = comboOf(event);

		// still holding only Ctrl, Alt or Shift
		if (!combo) {
			return;
		}

		const hasModifier = event.ctrlKey || event.altKey || event.metaKey;

		if (!hasModifier && !/^f\d+$/.test(combo)) {
			hotkeyMessage.textContent = "Use Ctrl, Alt or Meta together with another key.";

			return;
		}

		const taken = hotkeyActions.find(function (item) {
			return item !== current.action && comboFor(item) === combo;
		});

		if (taken) {
			hotkeyMessage.textContent = prettyCombo(combo) + " is already used for \"" + taken.label + "\".";

			return;
		}

		customHotkeys[current.action.id] = combo;

		saveHotkeys();

		hotkeyMessage.textContent = "";

		finish();
	},
	true
);

document.getElementById("hotkeyReset").addEventListener("click", function () {
	customHotkeys = {};

	localStorage.removeItem(HOTKEYS_KEY);

	hotkeyMessage.textContent = "";

	capturingHotkey = null;

	renderHotkeyList();
});

renderHotkeyList();
