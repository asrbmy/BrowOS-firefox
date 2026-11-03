// First-run tour: a few pointers to the parts of the desktop

const TOUR_KEY = "browos-tour-done";

const tourSteps = [
	{ target: "#startButton", title: "Start menu", text: "Open apps, search everything (Ctrl + K) and lock the screen from here." },
	{ target: "#taskbarApps", title: "Taskbar", text: "Apps you open show up here. Click one to bring it back or minimize it." },
	{ target: ".tray", title: "Tray", text: "Task View, virtual desktops, clipboard history, notifications and quick settings." },
	{ target: ".desktop-shell", title: "Your desktop", text: "Right-click for wallpapers, widgets and sticky notes. Ctrl + Shift + P opens the command palette, Alt + J switches windows." },
];

let tourIndex = 0;

const tourEl = document.createElement("div");

tourEl.className = "tour";
tourEl.hidden = true;
tourEl.setAttribute("role", "dialog");
tourEl.setAttribute("aria-label", "Tour");

tourEl.innerHTML =
	'<div class="tour-ring"></div><div class="tour-card"><h3 id="tourTitle"></h3><p id="tourText"></p><div class="tour-buttons"><button id="tourSkip">Skip</button><span></span><button id="tourBack">Back</button><button id="tourNext" class="primary">Next</button></div></div>';

document.body.appendChild(tourEl);

const tourRing = tourEl.querySelector(".tour-ring");
const tourCard = tourEl.querySelector(".tour-card");

function drawTour() {
	const step = tourSteps[tourIndex];

	const target = document.querySelector(step.target);

	const rect = target ? target.getBoundingClientRect() : { left: window.innerWidth / 2 - 50, top: window.innerHeight / 2 - 50, width: 100, height: 100 };

	const whole = step.target === ".desktop-shell";

	// the desktop itself is too big to circle
	tourRing.style.display = whole ? "none" : "block";

	tourRing.style.left = rect.left - 6 + "px";
	tourRing.style.top = rect.top - 6 + "px";
	tourRing.style.width = rect.width + 12 + "px";
	tourRing.style.height = rect.height + 12 + "px";

	tourEl.querySelector("#tourTitle").textContent = step.title;
	tourEl.querySelector("#tourText").textContent = step.text;

	tourEl.querySelector("#tourBack").hidden = tourIndex === 0;
	tourEl.querySelector("#tourNext").textContent = tourIndex === tourSteps.length - 1 ? "Done" : "Next";

	const cardWidth = 300;

	if (whole) {
		tourCard.style.left = window.innerWidth / 2 - cardWidth / 2 + "px";
		tourCard.style.top = window.innerHeight / 2 - 90 + "px";
	} else {
		tourCard.style.left = Math.max(10, Math.min(window.innerWidth - cardWidth - 10, rect.left + rect.width / 2 - cardWidth / 2)) + "px";
		tourCard.style.top = Math.max(10, rect.top - tourCard.offsetHeight - 24) + "px";
	}
}

function startTour() {
	closeStartMenu();
	closeFlyouts();

	tourIndex = 0;

	tourEl.hidden = false;

	drawTour();

	tourEl.querySelector("#tourNext").focus();
}

function endTour() {
	tourEl.hidden = true;

	localStorage.setItem(TOUR_KEY, "1");
}

tourEl.querySelector("#tourNext").addEventListener("click", function () {
	if (tourIndex >= tourSteps.length - 1) {
		endTour();
	} else {
		tourIndex++;

		drawTour();
	}
});

tourEl.querySelector("#tourBack").addEventListener("click", function () {
	tourIndex = Math.max(0, tourIndex - 1);

	drawTour();
});

tourEl.querySelector("#tourSkip").addEventListener("click", endTour);

document.addEventListener(
	"keydown",
	function (event) {
		if (!tourEl.hidden && event.key === "Escape") {
			event.stopPropagation();

			endTour();
		}
	},
	true
);

window.addEventListener("resize", function () {
	if (!tourEl.hidden) {
		drawTour();
	}
});

// shown once, after the boot animation, and never over the lock screen
if (!localStorage.getItem(TOUR_KEY)) {
	setTimeout(function () {
		if (!localStorage.getItem(TOUR_KEY) && !(typeof locked !== "undefined" && locked)) {
			startTour();
		}
	}, 2500);
}
