// Theme editor
// Pick any accent color, save the current look under a name, and share it as a code.
// Saved looks are kept in localStorage and applied through the theme pack code.

const MY_THEMES_KEY = "browos-my-themes";

const myThemeList = document.getElementById("myThemeList");
const myThemeName = document.getElementById("myThemeName");
const myThemeSave = document.getElementById("myThemeSave");
const myThemeImport = document.getElementById("myThemeImport");
const customAccent = document.getElementById("customAccent");
const myThemeNote = document.getElementById("myThemeNote");

let myThemes = [];

try {
	const saved = JSON.parse(localStorage.getItem(MY_THEMES_KEY));

	if (Array.isArray(saved)) {
		myThemes = saved.filter(validLook);
	}
} catch (error) {
	myThemes = [];
}

function validLook(look) {
	return (
		look &&
		typeof look.name === "string" &&
		["dark", "light"].includes(look.theme) &&
		["rounded", "square"].includes(look.corners) &&
		["windows", "mac"].includes(look.buttons) &&
		Number.isFinite(Number(look.transparency)) &&
		/^#[0-9a-f]{6}$/i.test(look.accent)
	);
}

function saveMyThemes() {
	try {
		localStorage.setItem(MY_THEMES_KEY, JSON.stringify(myThemes));
	} catch (error) {
		myThemeNote.textContent = "Couldn't save: browser storage is full.";
	}
}

function currentAccent() {
	const stored = localStorage.getItem("browos-accent");

	if (/^#[0-9a-f]{6}$/i.test(stored || "")) {
		return stored;
	}

	const value = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();

	return /^#[0-9a-f]{6}$/i.test(value) ? value : "#2196f3";
}

function currentLook(name) {
	return {
		name: name,
		theme: themeSelect.value,
		corners: cornersSelect.value,
		buttons: buttonsSelect.value,
		transparency: Number(transparencySlider.value),
		accent: currentAccent().toLowerCase(),
	};
}

function applyLook(look) {
	THEME_PACKS["my-look"] = {
		theme: look.theme,
		corners: look.corners,
		buttons: look.buttons,
		transparency: Number(look.transparency),
		accent: look.accent,
	};

	applyThemePack("my-look");

	delete THEME_PACKS["my-look"];

	// the pack list has no entry for it, so the look is "Custom"
	localStorage.setItem("browos-theme-pack", "custom");

	syncContrastClass();

	themePackSelect.value = "custom";

	applyingPack = true;

	themePackSelect.dispatchEvent(new Event("change"));

	applyingPack = false;

	customAccent.value = look.accent;
}

function copyText(text) {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		return navigator.clipboard.writeText(text);
	}

	return Promise.reject(new Error("no clipboard"));
}

function renderMyThemes() {
	myThemeList.textContent = "";

	if (myThemes.length === 0) {
		const empty = document.createElement("p");

		empty.className = "settings-note";

		empty.textContent = "No saved looks yet. Set things up the way you like, then save it here.";

		myThemeList.appendChild(empty);

		return;
	}

	myThemes.forEach(function (look, index) {
		const row = document.createElement("div");

		row.className = "my-theme";

		const swatch = document.createElement("span");

		swatch.className = "my-theme-swatch";

		swatch.style.background = look.accent;

		const name = document.createElement("span");

		name.className = "my-theme-name";

		name.textContent = look.name;

		const apply = document.createElement("button");

		apply.textContent = "Use";

		apply.addEventListener("click", function () {
			applyLook(look);

			myThemeNote.textContent = "Applied " + look.name + ".";
		});

		const share = document.createElement("button");

		share.textContent = "Copy code";

		share.addEventListener("click", function () {
			copyText(JSON.stringify(look)).then(
				function () {
					myThemeNote.textContent = "Code copied. Paste it with Import on another computer.";
				},
				function () {
					myThemeNote.textContent = "Couldn't reach the clipboard.";
				}
			);
		});

		const remove = document.createElement("button");

		remove.textContent = "Delete";

		remove.addEventListener("click", function () {
			myThemes.splice(index, 1);

			saveMyThemes();

			renderMyThemes();
		});

		row.append(swatch, name, apply, share, remove);

		myThemeList.appendChild(row);
	});
}

function addMyTheme(look) {
	const taken = myThemes.findIndex(function (item) {
		return item.name.toLowerCase() === look.name.toLowerCase();
	});

	// saving under an existing name replaces it
	if (taken >= 0) {
		myThemes[taken] = look;
	} else {
		myThemes.push(look);
	}

	saveMyThemes();

	renderMyThemes();
}

myThemeSave.addEventListener("click", function () {
	const name = myThemeName.value.trim().slice(0, 30);

	if (!name) {
		myThemeNote.textContent = "Give the look a name first.";

		myThemeName.focus();

		return;
	}

	addMyTheme(currentLook(name));

	myThemeName.value = "";

	myThemeNote.textContent = "Saved " + name + ".";
});

myThemeImport.addEventListener("click", function () {
	const text = prompt("Paste a theme code");

	if (!text) {
		return;
	}

	try {
		const look = JSON.parse(text);

		if (!validLook(look)) {
			throw new Error("bad look");
		}

		look.name = String(look.name).trim().slice(0, 30) || "Imported";

		look.transparency = Math.max(0, Math.min(100, Number(look.transparency)));

		look.accent = look.accent.toLowerCase();

		addMyTheme({ name: look.name, theme: look.theme, corners: look.corners, buttons: look.buttons, transparency: look.transparency, accent: look.accent });

		myThemeNote.textContent = "Imported " + look.name + ". Press Use to apply it.";
	} catch (error) {
		myThemeNote.textContent = "That isn't a theme code from BrowOS.";
	}
});

// any accent color

customAccent.value = currentAccent();

customAccent.addEventListener("input", function () {
	setAccent(customAccent.value);

	localStorage.setItem("browos-accent", customAccent.value);

	becomeCustom();
});

accentOptions.forEach(function (option) {
	option.addEventListener("click", function () {
		setTimeout(function () {
			customAccent.value = currentAccent();
		}, 0);
	});
});

renderMyThemes();
