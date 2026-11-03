// Virtual desktops
// Every open window belongs to one desktop. Desktop icons, widgets and the taskbar are shared.

const DESKTOP_COUNT = 4;

let currentDesktop = 1;

const desktopBadge = document.getElementById("desktopBadge");

let desktopBadgeTimer = null;

function windowDesktop(appWindow) {
	return Number(appWindow.dataset.desktop) || 0;
}

function windowOnOtherDesktop(appWindow) {
	const number = windowDesktop(appWindow);

	return number !== 0 && number !== currentDesktop;
}

function windowsOnDesktop(number) {
	return Array.from(document.querySelectorAll(".app-window[data-running]")).filter(function (appWindow) {
		return windowDesktop(appWindow) === number;
	});
}

// the window in front on this desktop

function frontWindow() {
	let best = null;

	document.querySelectorAll(".app-window.show:not(.other-desktop)").forEach(function (appWindow) {
		if (!best || Number(appWindow.style.zIndex || 0) > Number(best.style.zIndex || 0)) {
			best = appWindow;
		}
	});

	return best;
}

function applyDesktop() {
	document.querySelectorAll(".app-window[data-desktop]").forEach(function (appWindow) {
		appWindow.classList.toggle("other-desktop", windowOnOtherDesktop(appWindow));
	});

	// taskbar buttons of windows that live on another desktop look dimmed
	document.querySelectorAll("[data-taskbar-app]").forEach(function (button) {
		const appWindow = document.querySelector(
			'.app-window[data-app-id="' + button.dataset.taskbarApp + '"]'
		);

		button.classList.toggle("elsewhere", Boolean(appWindow) && windowOnOtherDesktop(appWindow));
	});

	document.dispatchEvent(new Event("desktops-changed"));
}

function showDesktopBadge(text) {
	desktopBadge.textContent = text;

	desktopBadge.classList.add("show");

	clearTimeout(desktopBadgeTimer);

	desktopBadgeTimer = setTimeout(function () {
		desktopBadge.classList.remove("show");
	}, 900);
}

function switchDesktop(number) {
	if (number < 1 || number > DESKTOP_COUNT || number === currentDesktop) {
		return;
	}

	currentDesktop = number;

	applyDesktop();

	showDesktopBadge("Desktop " + number);
}

function moveWindowToDesktop(appWindow, number, follow) {
	if (number < 1 || number > DESKTOP_COUNT) {
		return;
	}

	appWindow.dataset.desktop = number;

	if (follow) {
		switchDesktop(number);

		bringToFront(appWindow);
	}

	applyDesktop();
}

// a new window starts on the desktop you are looking at,
// opening one that lives somewhere else takes you there

const openAppOnDesktop = openApp;

openApp = function (appWindow) {
	if (appWindow.dataset.running && windowOnOtherDesktop(appWindow)) {
		switchDesktop(windowDesktop(appWindow));
	} else if (!appWindow.dataset.running) {
		appWindow.dataset.desktop = currentDesktop;
	}

	openAppOnDesktop(appWindow);

	applyDesktop();

	focusAppFrame(appWindow);
};

// an opened app gets the keyboard right away (games, Notepad...), without a click first
function focusAppFrame(appWindow) {
	const frame = appWindow.querySelector("iframe");

	if (!frame) {
		return;
	}

	function focusIt() {
		// not while the person is typing in the Start menu search or another desktop text field
		const active = document.activeElement;

		if (active && active !== document.body && active.tagName !== "IFRAME" && active.closest("input, textarea, select, [contenteditable='true']") && !appWindow.contains(active)) {
			return;
		}

		frame.focus();
	}

	let loaded = false;

	try {
		loaded = frame.contentDocument && frame.contentDocument.readyState === "complete" && frame.contentDocument.URL !== "about:blank";
	} catch (error) {
		// another origin: it can still take the focus, whether it is loaded or not
		loaded = true;
	}

	if (loaded) {
		focusIt();
	} else {
		frame.addEventListener("load", focusIt, { once: true });
	}
}

const closeAppOnDesktop = closeApp;

closeApp = function (appWindow) {
	closeAppOnDesktop(appWindow);

	delete appWindow.dataset.desktop;

	appWindow.classList.remove("other-desktop");

	applyDesktop();
};
