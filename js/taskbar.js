// Taskbar apps

const taskbarApps = document.getElementById("taskbarApps");

function getTaskbarButton(appId) {
	return document.querySelector(`[data-taskbar-app="${appId}"]`);
}

function createTaskbarButton(appWindow) {
	const appId = appWindow.dataset.appId;

	const appName = appWindow.dataset.appName;

	const appIcon = appWindow.dataset.appIcon;

	let button = getTaskbarButton(appId);

	if (button) {
		return button;
	}

	button = document.createElement("button");

	button.className = "taskbar-app-button active";

	button.dataset.taskbarApp = appId;

	button.innerHTML = `

		<img
			src="${appIcon}"
			alt="${appName}"
		>

	`;

	button.addEventListener("click", function () {
		// the window is on another virtual desktop: go there instead of hiding it
		if (typeof windowOnOtherDesktop === "function" && windowOnOtherDesktop(appWindow)) {
			switchDesktop(Number(appWindow.dataset.desktop));

			bringToFront(appWindow);

			return;
		}

		if (appWindow.classList.contains("show")) {
			appWindow.classList.remove("show");

			button.classList.remove("active");
		} else {
			launchApp(appWindow.dataset.appId);
		}
	});

	taskbarApps.appendChild(button);

	return button;
}

function openApp(appWindow) {
	// the Task Manager lists windows that are running (open or minimized)

	appWindow.dataset.running = "true";

	const frame = appWindow.querySelector("iframe[data-src]");

	if (frame && !frame.src) {
		frame.src = frame.dataset.src;
	}

	appWindow.classList.add("show");

	bringToFront(appWindow);

	const button = createTaskbarButton(appWindow);

	button.classList.add("active");
}

function minimizeApp(appWindow) {
	appWindow.classList.remove("show");

	const button = getTaskbarButton(appWindow.dataset.appId);

	if (button) {
		button.classList.remove("active");
	}
}

function closeApp(appWindow) {
	delete appWindow.dataset.running;

	appWindow.classList.remove("show");

	const button = getTaskbarButton(appWindow.dataset.appId);

	// pinned apps keep their taskbar button

	if (button && isPinned(appWindow.dataset.appId)) {
		button.classList.remove("active");
	} else if (button) {
		button.remove();
	}
}
