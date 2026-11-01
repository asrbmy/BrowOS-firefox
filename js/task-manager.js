// Task manager

const taskManagerWindow = document.getElementById("taskManagerWindow");

const tmList = document.getElementById("tmList");

const tmCount = document.getElementById("tmCount");

const tmEmpty = document.getElementById("tmEmpty");

const tmMemory = document.getElementById("tmMemory");

const tmMemoryText = document.getElementById("tmMemoryText");

const tmMemoryBar = document.getElementById("tmMemoryBar");

const tmMemoryUsed = document.getElementById("tmMemoryUsed");

const tmMemoryAvailable = document.getElementById("tmMemoryAvailable");

// Everything that is running

function runningTasks() {
	const tasks = [];

	// BrowOS windows: open or minimized

	document.querySelectorAll(".app-window[data-running]").forEach(function (appWindow) {
		tasks.push({
			key: "window-" + appWindow.id,
			name: appWindow.dataset.appName,
			icon: appWindow.dataset.appIcon,
			tag: appWindow.classList.contains("show") ? "" : "Minimized",

			focus: function () {
				openApp(appWindow);
			},

			close: function () {
				closeApp(appWindow);
			},
		});
	});

	// the Explorer (Files)

	if (explorerWindow.classList.contains("show")) {
		tasks.push({
			key: "explorer",
			name: "Files",
			icon: "icons/explorer-icon.png",
			tag: "",

			focus: function () {
				bringToFront(explorerWindow);
			},

			close: function () {
				explorerWindow.classList.remove("show");
			},
		});
	}

	// apps open in their own browser window

	Object.keys(floatingWindows).forEach(function (appId) {
		const app = getApp(appId);

		const windowId = floatingWindows[appId];

		if (!app) {
			return;
		}

		tasks.push({
			key: "floating-" + appId,
			name: app.name,
			icon: app.icon,
			tag: "Separate window",

			focus: function () {
				chrome.windows
					.update(windowId, { state: "normal", focused: true })
					.catch(function () {});
			},

			close: function () {
				closeFloatingWindow(appId);
			},
		});
	});

	return tasks;
}

// The list

function renderTaskManager() {
	const tasks = runningTasks();

	tmCount.textContent = tasks.length;

	tmList.innerHTML = "";

	tasks.forEach(function (task) {
		const row = document.createElement("div");

		row.className = "tm-row";

		const icon = document.createElement("img");

		setIcon(icon, { icon: task.icon, name: task.name });

		const name = document.createElement("span");

		name.className = "tm-name";
		name.textContent = task.name;

		const tag = document.createElement("span");

		tag.className = "tm-tag";
		tag.textContent = task.tag;

		const focusButton = document.createElement("button");

		focusButton.textContent = "Focus";

		focusButton.addEventListener("click", function () {
			task.focus();

			setTimeout(renderTaskManager, 100);
		});

		const closeButton = document.createElement("button");

		closeButton.className = "tm-close";

		closeButton.textContent = "Close";

		closeButton.addEventListener("click", function () {
			task.close();

			setTimeout(renderTaskManager, 200);
		});

		row.append(icon, name, tag, focusButton, closeButton);

		tmList.appendChild(row);
	});

	tmEmpty.hidden = tasks.length > 0;
}

// SYSTEM MEMORY (the whole computer, not BrowOS)

function formatGB(bytes) {
	return (bytes / 1073741824).toFixed(1) + " GB";
}

function renderMemory() {
	// only when the browser supports it

	if (!chrome.system || !chrome.system.memory) {
		tmMemory.hidden = true;

		return;
	}

	chrome.system.memory.getInfo(function (info) {
		if (!info || !info.capacity) {
			tmMemory.hidden = true;

			return;
		}

		const used = info.capacity - info.availableCapacity;

		tmMemory.hidden = false;

		tmMemoryText.textContent = formatGB(info.capacity) + " total";
		tmMemoryUsed.textContent = formatGB(used) + " used";
		tmMemoryAvailable.textContent = formatGB(info.availableCapacity) + " available";

		tmMemoryBar.style.width = Math.round((used / info.capacity) * 100) + "%";
	});
}

// Keep it updated while it is open

setInterval(function () {
	if (taskManagerWindow.classList.contains("show")) {
		renderTaskManager();

		renderMemory();
	}
}, 1500);

function openTaskManager() {
	openApp(taskManagerWindow);

	renderTaskManager();

	renderMemory();
}

// opened from the Start menu or the taskbar button

new MutationObserver(function () {
	if (taskManagerWindow.classList.contains("show")) {
		renderTaskManager();

		renderMemory();
	}
}).observe(taskManagerWindow, { attributes: true, attributeFilter: ["class"] });

// Taskbar right click menu

const taskbarMenu = document.getElementById("taskbarMenu");

document.querySelector(".taskbar").addEventListener("contextmenu", function (event) {
	// app buttons have their own menu

	if (event.target.closest(".taskbar-app-button")) {
		return;
	}

	event.preventDefault();

	taskbarMenu.classList.add("show");

	// the taskbar is at the bottom, so the menu opens upwards

	const x = Math.min(event.clientX, window.innerWidth - taskbarMenu.offsetWidth - 8);

	const y = event.clientY - taskbarMenu.offsetHeight - 8;

	taskbarMenu.style.left = x + "px";
	taskbarMenu.style.top = y + "px";
});

taskbarMenu.querySelectorAll(".context-item").forEach(function (item) {
	item.addEventListener("click", function () {
		taskbarMenu.classList.remove("show");

		if (item.dataset.action === "task-manager") {
			openTaskManager();
		}

		if (item.dataset.action === "taskbar-settings") {
			openApp(document.getElementById("settingsWindow"));

			document.querySelector('.settings-nav[data-page="taskbarPage"]').click();
		}
	});
});

document.addEventListener("pointerdown", function (event) {
	if (!taskbarMenu.contains(event.target)) {
		taskbarMenu.classList.remove("show");
	}
});

document.addEventListener("keydown", function (event) {
	if (event.key === "Escape") {
		taskbarMenu.classList.remove("show");
	}
});
