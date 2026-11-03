// Start menu search
// Type in the Start menu to find apps, settings pages, quick actions, sums and the web.

const startSearchInput = document.getElementById("startSearch");
const startResults = document.getElementById("startResults");

const settingsTargets = [
	{ name: "Personalization", page: "personalizationPage", words: "wallpaper theme dark light accent color colour cursor corners transparency desktop text appearance" },
	{ name: "Startup", page: "startupPage", words: "boot animation sound volume startup interface" },
	{ name: "Taskbar", page: "taskbarPage", words: "taskbar clock width size" },
	{ name: "Security", page: "securityPage", words: "pin lock password screensaver screen saver idle privacy security" },
	{ name: "Widgets", page: "widgetsPage", words: "widgets sticky notes calendar weather quote clock system" },
	{ name: "Shortcuts", page: "shortcutsPage", words: "keyboard shortcuts keys hotkeys" },
	{ name: "Data", page: "dataPage", words: "backup export import restore data reset" },
	{ name: "About", page: "aboutPage", words: "about version reset" },
	{ name: "Credits", page: "creditsPage", words: "credits licenses thanks" },
];

function openSettingsPage(page) {
	openApp(settingsWindow);

	const button = document.querySelector('.settings-nav[data-page="' + page + '"]');

	if (button) {
		button.click();
	}
}

const quickActions = [
	{ name: "Lock the screen", words: "lock screen", run: function () { lockScreen(); } },
	{ name: "Start the screensaver", words: "screensaver screen saver sleep", run: function () { startScreensaver(); } },
	{ name: "New sticky note", words: "sticky note notes write", run: function () { createStickyNote(""); } },
	{
		name: "Switch between dark and light mode",
		words: "theme dark light mode night",
		run: function () {
			window.browosApi.setTheme(document.documentElement.classList.contains("light-mode") ? "dark" : "light");
		},
	},
	{ name: "Next wallpaper", words: "wallpaper background change", run: function () { nextWallpaper(); } },
	{
		name: "Turn Do not disturb on or off",
		words: "do not disturb dnd quiet notifications silent",
		run: function () { setDoNotDisturb(!doNotDisturb()); },
	},
	{ name: "Open the notification center", words: "notifications bell", run: function () { openNotificationCenter(); placeFlyout(notificationCenter, bellButton); } },
];

let resultItems = [];
let selectedResult = 0;

function looksLikeMath(text) {
	return /^[\d\s.+\-*/%^()]+$/.test(text) && /[+\-*/%^]/.test(text) && /\d/.test(text);
}

function buildResults(text) {
	const query = text.trim();

	const lower = query.toLowerCase();

	const results = [];

	if (looksLikeMath(query)) {
		try {
			const value = safeCalculate(query);

			if (Number.isFinite(value)) {
				const shown = String(Math.round(value * 1e10) / 1e10);

				results.push({
					title: "= " + shown,
					detail: "Press Enter to copy the result",
					icon: "＝",
					run: function () {
						navigator.clipboard.writeText(shown).then(
							function () {
								notify("Calculator", shown + " copied");
							},
							function () {
								notify("Calculator", shown);
							}
						);
					},
				});
			}
		} catch (error) {
			// not a complete sum yet, keep typing
		}
	}

	// apps

	const apps = window.browosApi.listApps().filter(function (app) {
		return app.name.toLowerCase().includes(lower) || app.id.toLowerCase().includes(lower);
	});

	apps.sort(function (a, b) {
		const aStart = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
		const bStart = b.name.toLowerCase().startsWith(lower) ? 0 : 1;

		return aStart - bStart || a.name.localeCompare(b.name);
	});

	apps.slice(0, 5).forEach(function (app) {
		const entry = getApp(app.id);

		results.push({
			title: app.name,
			detail: "App",
			iconUrl: entry ? entry.icon : null,
			run: function () {
				launchApp(app.id);
			},
		});
	});

	// settings pages

	settingsTargets
		.filter(function (target) {
			return target.name.toLowerCase().includes(lower) || target.words.includes(lower);
		})
		.slice(0, 3)
		.forEach(function (target) {
			results.push({
				title: target.name,
				detail: "Settings",
				icon: "⚙",
				run: function () {
					openSettingsPage(target.page);
				},
			});
		});

	// quick actions

	quickActions
		.filter(function (action) {
			return action.name.toLowerCase().includes(lower) || action.words.includes(lower);
		})
		.slice(0, 3)
		.forEach(function (action) {
			results.push({
				title: action.name,
				detail: "Action",
				icon: "⚡",
				run: action.run,
			});
		});

	// the web

	const address = webAddress(query);

	results.push({
		title: address ? "Open " + query : "Search the web for \"" + query + "\"",
		detail: "Opens in a new tab",
		icon: "🌐",
		run: function () {
			openInBrowserTab(address || searchEngines[searchEngine] + encodeURIComponent(query));
		},
	});

	return results;
}

function drawResults() {
	startResults.innerHTML = "";

	resultItems.forEach(function (item, position) {
		const row = document.createElement("div");

		row.className = "start-result" + (position === selectedResult ? " selected" : "");

		const icon = document.createElement("span");

		icon.className = "start-result-icon";

		if (item.iconUrl) {
			const image = document.createElement("img");

			image.src = item.iconUrl;
			image.alt = "";

			image.addEventListener(
				"error",
				function () {
					image.remove();

					icon.textContent = "▢";
				},
				{ once: true }
			);

			icon.appendChild(image);
		} else {
			icon.textContent = item.icon || "";
		}

		const label = document.createElement("span");

		label.className = "start-result-label";

		const title = document.createElement("span");

		title.className = "start-result-title";
		title.textContent = item.title;

		const detail = document.createElement("span");

		detail.className = "start-result-detail";
		detail.textContent = item.detail;

		label.append(title, detail);

		row.append(icon, label);

		row.addEventListener("click", function () {
			runResult(item);
		});

		row.addEventListener("pointermove", function () {
			if (selectedResult !== position) {
				selectedResult = position;

				startResults.querySelectorAll(".start-result").forEach(function (other, index) {
					other.classList.toggle("selected", index === position);
				});
			}
		});

		startResults.appendChild(row);
	});
}

function runResult(item) {
	closeStartMenu();

	resetStartSearch();

	item.run();
}

function resetStartSearch() {
	startSearchInput.value = "";

	startMenu.classList.remove("searching");

	startResults.hidden = true;

	resultItems = [];
}

startSearchInput.addEventListener("input", function () {
	const text = startSearchInput.value;

	if (text.trim() === "") {
		resetStartSearch();

		return;
	}

	// the apps panel is for browsing, searching happens here
	appsPanel.classList.remove("show");
	appsMenuItem.classList.remove("active");

	resultItems = buildResults(text);

	selectedResult = 0;

	startMenu.classList.add("searching");

	startResults.hidden = false;

	drawResults();
});

startSearchInput.addEventListener("keydown", function (event) {
	if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		if (resultItems.length === 0) {
			return;
		}

		event.preventDefault();

		const step = event.key === "ArrowDown" ? 1 : -1;

		selectedResult = (selectedResult + step + resultItems.length) % resultItems.length;

		startResults.querySelectorAll(".start-result").forEach(function (row, index) {
			row.classList.toggle("selected", index === selectedResult);
		});

		return;
	}

	if (event.key === "Enter") {
		event.preventDefault();

		if (resultItems[selectedResult]) {
			runResult(resultItems[selectedResult]);
		}

		return;
	}

	if (event.key === "Escape") {
		event.stopPropagation();

		if (startSearchInput.value) {
			resetStartSearch();
		} else {
			closeStartMenu();
		}
	}
});

// opening the Start menu starts with an empty search box that is ready for typing

startButton.addEventListener("click", function () {
	if (startMenu.classList.contains("show")) {
		resetStartSearch();

		setTimeout(function () {
			startSearchInput.focus();
		}, 0);
	}
});

// used by the keyboard shortcut
function openStartSearch() {
	if (!startMenu.classList.contains("show")) {
		startButton.click();
	} else {
		startSearchInput.focus();

		startSearchInput.select();
	}
}
