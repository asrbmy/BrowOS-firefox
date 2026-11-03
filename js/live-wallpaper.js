// Live wallpapers
// A canvas behind the desktop icons, drawn on top of the chosen wallpaper.
// It pauses when the tab is hidden and stays off when "reduce motion" is on.

const LIVE_WALLPAPER_KEY = "browos-live-wallpaper";

const liveWallpaperModes = {
	off: "Off",
	aurora: "Aurora",
	particles: "Floating dots",
	rain: "Rain",
	stars: "Starfield",
};

const liveCanvas = document.createElement("canvas");

liveCanvas.className = "live-wallpaper";
liveCanvas.setAttribute("aria-hidden", "true");

desktopShell.insertBefore(liveCanvas, desktopShell.firstChild);

const liveContext = liveCanvas.getContext("2d");

let liveMode = "off";
let liveFrame = 0;
let liveItems = [];
let liveSize = { w: 0, h: 0 };

function liveRandom(min, max) {
	return min + Math.random() * (max - min);
}

function liveResize() {
	const ratio = Math.min(window.devicePixelRatio || 1, 2);

	liveSize.w = liveCanvas.clientWidth;
	liveSize.h = liveCanvas.clientHeight;

	liveCanvas.width = Math.max(1, Math.round(liveSize.w * ratio));
	liveCanvas.height = Math.max(1, Math.round(liveSize.h * ratio));

	liveContext.setTransform(ratio, 0, 0, ratio, 0, 0);

	liveSeed();
}

function liveAccent() {
	return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#2196f3";
}

function liveSeed() {
	const area = liveSize.w * liveSize.h;

	liveItems = [];

	let count = 0;

	if (liveMode === "particles") {
		count = Math.min(90, Math.round(area / 18000));
	} else if (liveMode === "rain") {
		count = Math.min(160, Math.round(area / 9000));
	} else if (liveMode === "stars") {
		count = Math.min(220, Math.round(area / 7000));
	} else if (liveMode === "aurora") {
		count = 4;
	}

	for (let i = 0; i < count; i++) {
		liveItems.push({
			x: liveRandom(0, liveSize.w),
			y: liveRandom(0, liveSize.h),
			z: liveRandom(0.3, 1),
			r: liveRandom(1, 3),
			p: liveRandom(0, Math.PI * 2),
		});
	}
}

function liveDraw(time) {
	const ctx = liveContext;
	const w = liveSize.w;
	const h = liveSize.h;

	ctx.clearRect(0, 0, w, h);

	if (liveMode === "aurora") {
		const accent = liveAccent();

		ctx.globalCompositeOperation = "lighter";

		liveItems.forEach(function (band, index) {
			const x = w * (0.2 + 0.2 * index) + Math.sin(time / 4000 + band.p) * w * 0.12;
			const y = h * (0.35 + 0.1 * Math.sin(time / 5000 + band.p * 2));
			const radius = Math.max(w, h) * (0.28 + 0.06 * Math.sin(time / 3000 + band.p));
			const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

			gradient.addColorStop(0, index % 2 ? accent : "#7c4dff");
			gradient.addColorStop(1, "transparent");

			ctx.globalAlpha = 0.28;
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, w, h);
		});

		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = "source-over";

		return;
	}

	ctx.fillStyle = "#ffffff";
	ctx.strokeStyle = "rgba(255,255,255,0.55)";

	liveItems.forEach(function (item) {
		if (liveMode === "particles") {
			item.x += Math.cos(item.p) * 0.25 * item.z;
			item.y += Math.sin(item.p) * 0.25 * item.z - 0.1;

			if (item.x < -5) item.x = w + 5;
			if (item.x > w + 5) item.x = -5;
			if (item.y < -5) item.y = h + 5;

			ctx.globalAlpha = 0.25 + 0.4 * item.z;
			ctx.beginPath();
			ctx.arc(item.x, item.y, item.r * item.z, 0, Math.PI * 2);
			ctx.fill();
		} else if (liveMode === "rain") {
			item.y += 9 * item.z;
			item.x -= 1.5 * item.z;

			if (item.y > h) {
				item.y = -20;
				item.x = liveRandom(0, w + 40);
			}

			ctx.globalAlpha = 0.2 + 0.4 * item.z;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(item.x, item.y);
			ctx.lineTo(item.x + 3 * item.z, item.y - 14 * item.z);
			ctx.stroke();
		} else if (liveMode === "stars") {
			ctx.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(time / 1200 + item.p));
			ctx.beginPath();
			ctx.arc(item.x, item.y, item.r * item.z * 0.6, 0, Math.PI * 2);
			ctx.fill();
		}
	});

	ctx.globalAlpha = 1;
}

function liveLoop(time) {
	liveFrame = 0;

	if (liveMode === "off" || document.hidden) {
		return;
	}

	liveDraw(time);

	liveFrame = requestAnimationFrame(liveLoop);
}

function liveStart() {
	if (!liveFrame && liveMode !== "off" && !document.hidden) {
		liveFrame = requestAnimationFrame(liveLoop);
	}
}

function liveReduced() {
	return document.documentElement.classList.contains("reduce-motion");
}

function setLiveWallpaper(mode, save) {
	liveMode = liveWallpaperModes[mode] && !liveReduced() ? mode : "off";

	if (save !== false) {
		localStorage.setItem(LIVE_WALLPAPER_KEY, liveWallpaperModes[mode] ? mode : "off");
	}

	cancelAnimationFrame(liveFrame);

	liveFrame = 0;

	liveCanvas.hidden = liveMode === "off";

	liveResize();

	liveContext.clearRect(0, 0, liveSize.w, liveSize.h);

	liveStart();
}

window.addEventListener("resize", function () {
	if (liveMode !== "off") {
		liveResize();
	}
});

document.addEventListener("visibilitychange", liveStart);

// turning reduce motion on or off takes effect right away

new MutationObserver(function () {
	setLiveWallpaper(localStorage.getItem(LIVE_WALLPAPER_KEY) || "off", false);
}).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

// the picker in Settings → Personalization

const liveSelect = document.getElementById("liveWallpaper");

if (liveSelect) {
	Object.keys(liveWallpaperModes).forEach(function (key) {
		liveSelect.add(new Option(liveWallpaperModes[key], key));
	});

	liveSelect.value = localStorage.getItem(LIVE_WALLPAPER_KEY) || "off";

	liveSelect.addEventListener("change", function () {
		setLiveWallpaper(liveSelect.value);
	});
}

setLiveWallpaper(localStorage.getItem(LIVE_WALLPAPER_KEY) || "off", false);
