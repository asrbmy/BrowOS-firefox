// Wallpaper slideshow: changes the wallpaper by itself every few minutes

const SLIDESHOW_KEY = "browos-slideshow";
const SLIDESHOW_LAST_KEY = "browos-slideshow-last";

function slideshowMinutes() {
	const minutes = Number(localStorage.getItem(SLIDESHOW_KEY));

	return [1, 5, 15, 30, 60, 180].includes(minutes) ? minutes : 0;
}

function slideshowTick() {
	const minutes = slideshowMinutes();

	if (!minutes || document.hidden || (typeof locked !== "undefined" && locked)) {
		return;
	}

	const last = Number(localStorage.getItem(SLIDESHOW_LAST_KEY)) || 0;

	if (Date.now() - last >= minutes * 60000) {
		localStorage.setItem(SLIDESHOW_LAST_KEY, String(Date.now()));

		// the first run only starts the clock
		if (last) {
			nextWallpaper();
		}
	}
}

setInterval(slideshowTick, 15000);

slideshowTick();
