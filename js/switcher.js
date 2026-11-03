// Window switcher (hold Alt and press J) and Task View (every window on every desktop)

function switchableWindows() {
	return Array.from(document.querySelectorAll(".app-window[data-running]"))
		.filter(function (appWindow) {
			return appWindow.dataset.appId;
		})
		.sort(function (a, b) {
			return Number(b.style.zIndex || 0) - Number(a.style.zIndex || 0);
		});
}

function windowIcon(appWindow) {
	const app = getApp(appWindow.dataset.appId);

	const wrap = document.createDocumentFragment();

	if (app && app.icon) {
		const img = document.createElement("img");

		img.alt = "";
		img.src = app.icon;

		wrap.appendChild(img);
	} else {
		const letter = document.createElement("div");

		letter.className = "letter";
		letter.textContent = (appWindow.dataset.appName || "?").charAt(0).toUpperCase();

		wrap.appendChild(letter);
	}

	return wrap;
}

function windowStateText(appWindow) {
	const parts = [];

	if (!appWindow.classList.contains("show")) {
		parts.push("Minimized");
	}

	if (Number(appWindow.dataset.desktop) && appWindow.dataset.desktop !== String(currentDesktop)) {
		parts.push("Desktop " + appWindow.dataset.desktop);
	}

	return parts.join(" · ");
}

// bring a window to the person, wherever it is (other desktop, minimized, behind)
function focusWindow(appWindow) {
	if (!appWindow || !appWindow.dataset.running) {
		return;
	}

	if (!appWindow.classList.contains("show") || windowOnOtherDesktop(appWindow)) {
		openApp(appWindow);
	}

	bringToFront(appWindow);

	focusAppFrame(appWindow);
}

// Alt switcher

const switcherEl = document.createElement("div");

switcherEl.className = "overlay";
switcherEl.id = "switcher";
switcherEl.setAttribute("role", "dialog");
switcherEl.setAttribute("aria-label", "Switch window");

document.body.appendChild(switcherEl);

let switcherList = [];
let switcherIndex = 0;
let switcherHeld = false;

function switcherOpen() {
	return switcherEl.classList.contains("show");
}

function drawSwitcher() {
	switcherEl.innerHTML = "";

	if (switcherList.length === 0) {
		const empty = document.createElement("div");

		empty.className = "switcher-row switcher-empty";
		empty.textContent = "No windows open";

		switcherEl.appendChild(empty);

		return;
	}

	const row = document.createElement("div");

	row.className = "switcher-row";

	switcherList.forEach(function (appWindow, index) {
		const card = document.createElement("div");

		card.className = "switch-card" + (index === switcherIndex ? " selected" : "");
		card.setAttribute("role", "option");

		card.appendChild(windowIcon(appWindow));

		const name = document.createElement("span");

		name.className = "name";
		name.textContent = appWindow.dataset.appName;

		card.appendChild(name);

		const state = windowStateText(appWindow);

		if (state) {
			const sub = document.createElement("span");

			sub.className = "sub";
			sub.textContent = state;

			card.appendChild(sub);
		}

		card.addEventListener("click", function () {
			switcherIndex = index;

			commitSwitcher();
		});

		row.appendChild(card);
	});

	switcherEl.appendChild(row);
}

function openSwitcher(held) {
	switcherList = switchableWindows();

	// the first press already moves to the previous window
	switcherIndex = switcherList.length > 1 ? 1 : 0;

	switcherHeld = held;

	closeFlyouts();

	drawSwitcher();

	switcherEl.classList.add("show");
}

function cycleSwitcher(step) {
	if (switcherList.length === 0) {
		return;
	}

	switcherIndex = (switcherIndex + step + switcherList.length) % switcherList.length;

	drawSwitcher();
}

function closeSwitcher() {
	switcherEl.classList.remove("show");

	switcherHeld = false;
}

function commitSwitcher() {
	const target = switcherList[switcherIndex];

	closeSwitcher();

	focusWindow(target);
}

// the shortcut: first press opens, each press after that moves on
function switcherShortcut() {
	if (switcherOpen()) {
		cycleSwitcher(1);
	} else {
		openSwitcher(true);
	}
}

switcherEl.addEventListener("pointerdown", function (event) {
	if (event.target === switcherEl) {
		closeSwitcher();
	}
});

onEveryDocument(function (doc) {
	doc.addEventListener(
		"keydown",
		function (event) {
			if (!switcherOpen()) {
				return;
			}

			if (event.key === "Escape") {
				event.preventDefault();
				event.stopPropagation();

				closeSwitcher();
			} else if (event.key === "Tab" || event.key === "ArrowRight" || event.key === "ArrowDown") {
				event.preventDefault();
				event.stopPropagation();

				cycleSwitcher(event.shiftKey ? -1 : 1);
			} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
				event.preventDefault();
				event.stopPropagation();

				cycleSwitcher(-1);
			} else if (event.key === "Enter") {
				event.preventDefault();
				event.stopPropagation();

				commitSwitcher();
			}
		},
		true
	);

	// letting go of the modifier chooses the window
	doc.addEventListener(
		"keyup",
		function (event) {
			if (switcherOpen() && switcherHeld && (event.key === "Alt" || event.key === "Control" || event.key === "Meta")) {
				commitSwitcher();
			}
		},
		true
	);
});

window.addEventListener("blur", function () {
	if (switcherOpen() && switcherHeld) {
		closeSwitcher();
	}
});

// Task View

const taskView = document.createElement("div");

taskView.className = "overlay taskview";
taskView.id = "taskView";
taskView.setAttribute("role", "dialog");
taskView.setAttribute("aria-label", "Task View");

document.body.appendChild(taskView);

function taskViewOpen() {
	return taskView.classList.contains("show");
}

function drawTaskView() {
	taskView.innerHTML = "";

	const columns = document.createElement("div");

	columns.className = "taskview-columns";

	const all = switchableWindows();

	for (let number = 1; number <= DESKTOP_COUNT; number++) {
		const column = document.createElement("div");

		column.className = "taskview-column" + (number === currentDesktop ? " current" : "");

		const title = document.createElement("h4");

		title.textContent = "Desktop " + number;

		title.addEventListener("click", function () {
			closeTaskView();

			switchDesktop(number);
		});

		column.appendChild(title);

		const here = all.filter(function (appWindow) {
			return (Number(appWindow.dataset.desktop) || currentDesktop) === number;
		});

		if (here.length === 0) {
			const empty = document.createElement("div");

			empty.className = "taskview-empty";
			empty.textContent = "Drop windows here";

			column.appendChild(empty);
		}

		here.forEach(function (appWindow) {
			const card = document.createElement("div");

			card.className = "task-card";
			card.draggable = true;
			card.tabIndex = 0;

			card.appendChild(windowIcon(appWindow));

			const label = document.createElement("div");

			label.className = "title";

			const name = document.createElement("b");

			name.textContent = appWindow.dataset.appName;

			label.appendChild(name);

			if (!appWindow.classList.contains("show")) {
				const sub = document.createElement("span");

				sub.className = "sub";
				sub.textContent = "Minimized";

				label.appendChild(sub);
			}

			card.appendChild(label);

			function choose() {
				closeTaskView();

				if ((Number(appWindow.dataset.desktop) || currentDesktop) !== currentDesktop) {
					switchDesktop(Number(appWindow.dataset.desktop));
				}

				focusWindow(appWindow);
			}

			card.addEventListener("click", choose);

			card.addEventListener("keydown", function (event) {
				if (event.key === "Enter" || event.key === " ") {
					event.preventDefault();

					choose();
				}
			});

			card.addEventListener("dragstart", function (event) {
				event.dataTransfer.setData("text/x-browos-window", appWindow.dataset.appId);
			});

			column.appendChild(card);
		});

		column.addEventListener("dragover", function (event) {
			event.preventDefault();

			column.classList.add("drop");
		});

		column.addEventListener("dragleave", function () {
			column.classList.remove("drop");
		});

		column.addEventListener("drop", function (event) {
			event.preventDefault();

			column.classList.remove("drop");

			const id = event.dataTransfer.getData("text/x-browos-window");

			const target = all.find(function (appWindow) {
				return appWindow.dataset.appId === id;
			});

			if (target) {
				moveWindowToDesktop(target, number, false);

				drawTaskView();
			}
		});

		columns.appendChild(column);
	}

	taskView.appendChild(columns);
}

function openTaskView() {
	closeFlyouts();

	closeStartMenu();

	drawTaskView();

	taskView.classList.add("show");

	const first = taskView.querySelector(".task-card");

	if (first) {
		first.focus();
	}
}

function closeTaskView() {
	taskView.classList.remove("show");
}

function toggleTaskView() {
	if (taskViewOpen()) {
		closeTaskView();
	} else {
		openTaskView();
	}
}

taskView.addEventListener("pointerdown", function (event) {
	if (event.target === taskView || event.target === taskView.firstChild) {
		closeTaskView();
	}
});

document.addEventListener("keydown", function (event) {
	if (event.key === "Escape" && taskViewOpen()) {
		closeTaskView();
	}
});

// the tray button
(function () {
	const button = document.createElement("button");

	button.className = "tray-button";
	button.id = "taskViewButton";
	button.title = "Task View";
	button.setAttribute("aria-label", "Task View");

	button.innerHTML =
		'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="11" rx="2"></rect><line x1="8" y1="20" x2="16" y2="20"></line></svg>';

	button.addEventListener("click", toggleTaskView);

	document.getElementById("desktopSwitchButton").before(button);
})();

document.addEventListener("desktops-changed", function () {
	if (taskViewOpen()) {
		drawTaskView();
	}
});

hotkeyActions.push(
	{ id: "switchWindow", label: "Switch window (hold Alt and press again)", combo: "alt+j", run: switcherShortcut },
	{ id: "taskView", label: "Task View: all windows on all desktops", combo: "ctrl+alt+arrowup", run: toggleTaskView }
);

fixedHotkeys.push(["Tab / arrows (in the switcher)", "Move between windows, Enter to choose"]);
