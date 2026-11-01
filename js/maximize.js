// Maximize

function toggleMaximize(appWindow) {
	const maximizeButton = appWindow.querySelector(".window-maximize");

	if (appWindow.classList.contains("maximized")) {
		appWindow.classList.remove("maximized");

		maximizeButton.textContent = "□";
	} else {
		appWindow.classList.add("maximized");

		maximizeButton.textContent = "❐";
	}
}

function addMaximizeButton(appWindow) {
	const controls = appWindow.querySelector(".window-controls");

	const closeButton = appWindow.querySelector(".window-close");

	// add the maximize button between minimize and close

	const maximizeButton = document.createElement("button");

	maximizeButton.className = "window-maximize";

	maximizeButton.textContent = "□";

	controls.insertBefore(maximizeButton, closeButton);

	maximizeButton.addEventListener("click", function () {
		toggleMaximize(appWindow);
	});

	// double click on the title bar also maximizes

	appWindow.querySelector(".window-header").addEventListener("dblclick", function (event) {
		if (event.target.closest(".window-controls, .window-tools")) {
			return;
		}

		toggleMaximize(appWindow);
	});
}

document.querySelectorAll(".app-window").forEach(addMaximizeButton);
