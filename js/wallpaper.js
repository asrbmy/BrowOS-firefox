// Custom wallpaper tile

const wallpaperList = document.querySelector(".wallpaper-list");

const customTile = document.createElement("img");

customTile.className = "wallpaper-option";

customTile.hidden = true;

wallpaperList.appendChild(customTile);

function showCustomTile() {
	const image = localStorage.getItem("customWallpaper");

	if (!image) {
		customTile.hidden = true;

		return;
	}

	customTile.src = image;

	customTile.hidden = false;

	if (localStorage.getItem("wallpaper") === "custom") {
		wallpaperOptions.forEach(function (option) {
			option.classList.remove("selected");
		});

		customTile.classList.add("selected");
	}
}

showCustomTile();

customTile.addEventListener("click", function () {
	setWallpaper(localStorage.getItem("customWallpaper"));

	localStorage.setItem("wallpaper", "custom");

	customTile.classList.add("selected");
});

// choosing another wallpaper unselects the custom one

wallpaperOptions.forEach(function (option) {
	option.addEventListener("click", function () {
		customTile.classList.remove("selected");
	});
});
