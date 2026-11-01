// Appearance

const accentOptions = document.querySelectorAll(".accent-option");

const themeSelect = document.getElementById("themeSelect");

const cornersSelect = document.getElementById("cornersSelect");

const buttonsSelect = document.getElementById("buttonsSelect");

const transparencySlider = document.getElementById("transparencySlider");

const desktopTextToggle = document.getElementById("desktopTextToggle");

const desktopTextInput = document.getElementById("desktopTextInput");

const desktopTitle = document.getElementById("desktopTitle");

// Accent color

function setAccent(color) {
	document.documentElement.style.setProperty("--accent", color);

	accentOptions.forEach(function (option) {
		option.classList.remove("selected");

		if (option.dataset.color === color) {
			option.classList.add("selected");
		}
	});
}

setAccent(localStorage.getItem("browos-accent") || "#2196F3");

accentOptions.forEach(function (option) {
	option.addEventListener("click", function () {
		setAccent(option.dataset.color);

		localStorage.setItem("browos-accent", option.dataset.color);
	});
});

// Theme, corners and buttons

function updateAppearance() {
	const root = document.documentElement;

	if (themeSelect.value === "light") {
		root.classList.add("light-mode");
	} else {
		root.classList.remove("light-mode");
	}

	if (cornersSelect.value === "square") {
		root.classList.add("square-corners");
	} else {
		root.classList.remove("square-corners");
	}

	if (buttonsSelect.value === "mac") {
		root.classList.add("mac-buttons");
	} else {
		root.classList.remove("mac-buttons");
	}
}

themeSelect.value = localStorage.getItem("browos-theme") || "dark";

cornersSelect.value = localStorage.getItem("browos-corners") || "rounded";

buttonsSelect.value = localStorage.getItem("browos-buttons") || "windows";

updateAppearance();

themeSelect.addEventListener("change", function () {
	localStorage.setItem("browos-theme", themeSelect.value);

	updateAppearance();
});

cornersSelect.addEventListener("change", function () {
	localStorage.setItem("browos-corners", cornersSelect.value);

	updateAppearance();
});

buttonsSelect.addEventListener("change", function () {
	localStorage.setItem("browos-buttons", buttonsSelect.value);

	updateAppearance();
});

// Transparency

function updateTransparency() {
	// 0 = solid, 100 = very transparent

	document.documentElement.style.setProperty(
		"--glass",
		1 - (transparencySlider.value / 100) * 0.6
	);
}

transparencySlider.value = localStorage.getItem("browos-transparency") || 20;

updateTransparency();

transparencySlider.addEventListener("input", function () {
	localStorage.setItem("browos-transparency", transparencySlider.value);

	updateTransparency();
});

// Desktop text

function updateDesktopText() {
	desktopTitle.hidden = !desktopTextToggle.checked;

	desktopTitle.textContent = desktopTextInput.value || "BrowOS";
}

desktopTextToggle.checked = localStorage.getItem("browos-desktop-text-show") !== "off";

desktopTextInput.value = localStorage.getItem("browos-desktop-text") || "BrowOS";

updateDesktopText();

desktopTextToggle.addEventListener("change", function () {
	localStorage.setItem("browos-desktop-text-show", desktopTextToggle.checked ? "on" : "off");

	updateDesktopText();
});

desktopTextInput.addEventListener("input", function () {
	localStorage.setItem("browos-desktop-text", desktopTextInput.value);

	updateDesktopText();
});

// Taskbar size

const taskbar = document.querySelector(".taskbar");

const taskbarAutoToggle = document.getElementById("taskbarAutoToggle");

const taskbarWidthSlider = document.getElementById("taskbarWidthSlider");

function updateTaskbarSize() {
	// the slider is the minimum width, the taskbar still grows if apps need more space

	document.documentElement.style.setProperty("--taskbar-width", taskbarWidthSlider.value + "px");

	if (taskbarAutoToggle.checked) {
		document.documentElement.classList.add("taskbar-auto");

		taskbarWidthSlider.disabled = true;
	} else {
		document.documentElement.classList.remove("taskbar-auto");

		taskbarWidthSlider.disabled = false;
	}
}

taskbarAutoToggle.checked = localStorage.getItem("browos-taskbar-auto") === "on";

taskbarWidthSlider.value = localStorage.getItem("browos-taskbar-width") || 460;

updateTaskbarSize();

taskbarAutoToggle.addEventListener("change", function () {
	localStorage.setItem("browos-taskbar-auto", taskbarAutoToggle.checked ? "on" : "off");

	updateTaskbarSize();
});

taskbarWidthSlider.addEventListener("input", function () {
	localStorage.setItem("browos-taskbar-width", taskbarWidthSlider.value);

	updateTaskbarSize();
});

// the start menu opens above the left side of the taskbar, whatever its size

startButton.addEventListener("click", function () {
	const left = taskbar.getBoundingClientRect().left;

	startMenu.style.left = left + "px";

	appsPanel.style.left = left + startMenu.offsetWidth + 8 + "px";
});
