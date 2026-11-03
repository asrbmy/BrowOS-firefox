// Clipboard history
// Remembers text copied inside BrowOS (the desktop and its own apps) so it can be pasted again.
// Text copied in a website window or another tab never reaches BrowOS and is not stored.

const CLIP_KEY = "browos-clipboard";
const CLIP_ENABLED_KEY = "browos-clipboard-on";
const CLIP_MAX = 30;
const CLIP_MAX_LENGTH = 4000;

function clipboardHistoryOn() {
	return localStorage.getItem(CLIP_ENABLED_KEY) !== "false";
}

function loadClipboardHistory() {
	try {
		const list = JSON.parse(localStorage.getItem(CLIP_KEY) || "[]");

		return Array.isArray(list) ? list.filter(function (item) { return typeof item === "string"; }) : [];
	} catch (error) {
		return [];
	}
}

function addToClipboardHistory(text) {
	if (!clipboardHistoryOn()) {
		return;
	}

	text = String(text || "").slice(0, CLIP_MAX_LENGTH);

	if (!text.trim()) {
		return;
	}

	const list = loadClipboardHistory().filter(function (item) {
		return item !== text;
	});

	list.unshift(text);

	try {
		localStorage.setItem(CLIP_KEY, JSON.stringify(list.slice(0, CLIP_MAX)));
	} catch (error) {
		// storage full, the history just stops growing
	}

	if (clipFlyout.classList.contains("show")) {
		drawClipboardHistory();
	}
}

function clearClipboardHistory() {
	localStorage.removeItem(CLIP_KEY);

	drawClipboardHistory();
}

onEveryDocument(function (doc) {
	function grab(event) {
		let text = "";

		// the selection at the moment of copying (works for inputs and normal text)
		const active = doc.activeElement;

		if (active && typeof active.selectionStart === "number" && active.selectionEnd > active.selectionStart && active.type !== "password") {
			text = active.value.slice(active.selectionStart, active.selectionEnd);
		} else {
			const selection = doc.defaultView.getSelection();

			text = selection ? selection.toString() : "";
		}

		// never keep what comes out of a password field
		if (active && active.type === "password") {
			return;
		}

		addToClipboardHistory(text);
	}

	doc.addEventListener("copy", grab, true);
	doc.addEventListener("cut", grab, true);
});

// the flyout

const clipFlyout = document.createElement("div");

clipFlyout.className = "flyout clipboard-flyout";
clipFlyout.id = "clipboardFlyout";

clipFlyout.innerHTML =
	'<div class="flyout-header"><h3>Clipboard</h3><label class="flyout-toggle"><input type="checkbox" id="clipToggle"> Remember</label></div><div class="clip-list" id="clipList"></div><button class="flyout-link" id="clipClear">Clear history</button>';

document.body.appendChild(clipFlyout);

const clipList = clipFlyout.querySelector("#clipList");
const clipToggle = clipFlyout.querySelector("#clipToggle");

function drawClipboardHistory() {
	const items = loadClipboardHistory();

	clipToggle.checked = clipboardHistoryOn();

	clipList.innerHTML = "";

	if (items.length === 0) {
		const empty = document.createElement("div");

		empty.className = "clip-empty";
		empty.textContent = clipboardHistoryOn() ? "Copy some text and it shows up here." : "History is off.";

		clipList.appendChild(empty);

		return;
	}

	items.forEach(function (text) {
		const item = document.createElement("div");

		item.className = "clip-item";
		item.textContent = text;
		item.title = "Click to copy again";

		item.addEventListener("click", function () {
			navigator.clipboard.writeText(text).then(
				function () {
					notify("Copied", text.slice(0, 60), { duration: 1500 });
				},
				function () {
					notify("Couldn't copy", "The browser blocked access to the clipboard.", { duration: 2500 });
				}
			);

			closeFlyouts();
		});

		clipList.appendChild(item);
	});
}

clipToggle.addEventListener("change", function () {
	localStorage.setItem(CLIP_ENABLED_KEY, clipToggle.checked ? "true" : "false");

	drawClipboardHistory();
});

clipFlyout.querySelector("#clipClear").addEventListener("click", clearClipboardHistory);

const clipButton = document.createElement("button");

clipButton.className = "tray-button";
clipButton.id = "clipButton";
clipButton.title = "Clipboard history";
clipButton.setAttribute("aria-label", "Clipboard history");

clipButton.innerHTML =
	'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="5" width="12" height="16" rx="2"></rect><rect x="9" y="3" width="6" height="4" rx="1"></rect></svg>';

clipButton.addEventListener("click", function () {
	toggleFlyout(clipFlyout, clipButton, drawClipboardHistory);
});

document.getElementById("bellButton").before(clipButton);

function openClipboardHistory() {
	closeFlyouts("clipboardFlyout");

	drawClipboardHistory();

	clipFlyout.classList.add("show");

	placeFlyout(clipFlyout, clipButton);
}

hotkeyActions.push({ id: "clipboard", label: "Clipboard history", combo: "ctrl+alt+v", run: function () { clipFlyout.classList.contains("show") ? closeFlyouts() : openClipboardHistory(); } });

renderHotkeyList();
