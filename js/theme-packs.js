// Theme packs
// One choice that sets the theme, accent color, corners, window buttons and transparency together.

const themePackSelect = document.getElementById("themePackSelect");

const THEME_PACKS = {
	default: { theme: "dark", corners: "rounded", buttons: "windows", transparency: 20, accent: "#2196F3" },
	macos: { theme: "light", corners: "rounded", buttons: "mac", transparency: 25, accent: "#0a84ff" },
	retro: { theme: "dark", corners: "square", buttons: "windows", transparency: 0, accent: "#4caf50" },
	glass: { theme: "dark", corners: "rounded", buttons: "windows", transparency: 65, accent: "#00bcd4" },
	midnight: { theme: "dark", corners: "rounded", buttons: "mac", transparency: 30, accent: "#8e5cf7" },
	contrast: { theme: "dark", corners: "square", buttons: "windows", transparency: 0, accent: "#ffd400" },
	sunset: { theme: "dark", corners: "rounded", buttons: "windows", transparency: 35, accent: "#ff9800" },
};

let applyingPack = false;

// the high contrast pack also adds borders and removes blur
function syncContrastClass() {
	document.documentElement.classList.toggle("high-contrast", localStorage.getItem("browos-theme-pack") === "contrast");
}

syncContrastClass();

function applyThemePack(name) {
	const pack = THEME_PACKS[name];

	if (!pack) {
		return;
	}

	applyingPack = true;

	themeSelect.value = pack.theme;
	themeSelect.dispatchEvent(new Event("change"));

	cornersSelect.value = pack.corners;
	cornersSelect.dispatchEvent(new Event("change"));

	buttonsSelect.value = pack.buttons;
	buttonsSelect.dispatchEvent(new Event("change"));

	transparencySlider.value = pack.transparency;
	transparencySlider.dispatchEvent(new Event("input"));

	setAccent(pack.accent);
	localStorage.setItem("browos-accent", pack.accent);

	applyingPack = false;
}

// the pack the person picked, or "custom" once they change a single setting

const savedPack = localStorage.getItem("browos-theme-pack");

themePackSelect.value = THEME_PACKS[savedPack] ? savedPack : "custom";

// the dropdown that was drawn earlier needs to show it
applyingPack = true;

themePackSelect.dispatchEvent(new Event("change"));

applyingPack = false;

themePackSelect.addEventListener("change", function () {
	if (applyingPack) {
		return;
	}

	localStorage.setItem("browos-theme-pack", themePackSelect.value);

	syncContrastClass();

	if (THEME_PACKS[themePackSelect.value]) {
		applyThemePack(themePackSelect.value);
	}
});

// any single change afterwards makes it a custom look

function becomeCustom() {
	if (applyingPack || themePackSelect.value === "custom") {
		return;
	}

	localStorage.setItem("browos-theme-pack", "custom");

	syncContrastClass();

	themePackSelect.value = "custom";

	themePackSelect.dispatchEvent(new Event("change"));
}

[themeSelect, cornersSelect, buttonsSelect].forEach(function (control) {
	control.addEventListener("change", becomeCustom);
});

transparencySlider.addEventListener("input", becomeCustom);

accentOptions.forEach(function (option) {
	option.addEventListener("click", becomeCustom);
});
