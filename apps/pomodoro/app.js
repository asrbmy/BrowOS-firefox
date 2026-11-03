// Pomodoro timer

const SETTINGS_KEY = "browos-pomodoro";

const modesBar = document.getElementById("modes");
const timeText = document.getElementById("time");
const labelText = document.getElementById("label");
const progress = document.getElementById("progress");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const skipButton = document.getElementById("skipButton");
const statsText = document.getElementById("stats");

const inputs = {
	focus: document.getElementById("focusMinutes"),
	short: document.getElementById("shortMinutes"),
	long: document.getElementById("longMinutes"),
};

const labels = {
	focus: "Time to focus",
	short: "Take a short break",
	long: "Take a long break",
};

const CIRCLE = 339.292;

let minutes = { focus: 25, short: 5, long: 15 };
let completed = 0;

try {
	const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));

	if (saved && saved.minutes) {
		["focus", "short", "long"].forEach(function (mode) {
			const value = Number(saved.minutes[mode]);

			if (value >= 1 && value <= 180) {
				minutes[mode] = Math.floor(value);
			}
		});
	}
} catch (error) {
	// use the defaults
}

function saveSettings() {
	localStorage.setItem(SETTINGS_KEY, JSON.stringify({ minutes: minutes }));
}

let mode = "focus";
let running = false;
let endTime = 0;
let leftMs = minutes.focus * 60000;
let interval = null;

function pad(number) {
	return String(number).padStart(2, "0");
}

function draw() {
	const totalSeconds = Math.max(0, Math.ceil(leftMs / 1000));

	const text = pad(Math.floor(totalSeconds / 60)) + ":" + pad(totalSeconds % 60);

	timeText.textContent = text;

	const fraction = leftMs / (minutes[mode] * 60000);

	progress.style.strokeDashoffset = CIRCLE * (1 - Math.max(0, Math.min(1, fraction)));

	labelText.textContent = labels[mode];

	startButton.textContent = running ? "Pause" : "Start";

	statsText.textContent =
		completed === 0
			? "No focus sessions finished yet"
			: completed + (completed === 1 ? " focus session" : " focus sessions") + " finished";

	document.title = running ? text + " - Pomodoro" : "Pomodoro";
}

function setMode(next) {
	mode = next;

	running = false;

	clearInterval(interval);

	leftMs = minutes[mode] * 60000;

	modesBar.querySelectorAll("button").forEach(function (button) {
		button.classList.toggle("on", button.dataset.mode === mode);
	});

	draw();
}

function tell(title, message) {
	if (window.browos && window.browos.notify) {
		window.browos.notify(title, message, { sound: true });
	}
}

function finish() {
	clearInterval(interval);

	running = false;

	if (mode === "focus") {
		completed++;

		// every fourth session earns a long break
		const next = completed % 4 === 0 ? "long" : "short";

		tell("Focus session done", next === "long" ? "Time for a long break." : "Time for a short break.");

		setMode(next);
	} else {
		tell("Break is over", "Ready for the next focus session?");

		setMode("focus");
	}
}

function tick() {
	leftMs = endTime - Date.now();

	if (leftMs <= 0) {
		finish();

		return;
	}

	draw();
}

startButton.addEventListener("click", function () {
	if (running) {
		leftMs = endTime - Date.now();

		running = false;

		clearInterval(interval);
	} else {
		endTime = Date.now() + leftMs;

		running = true;

		interval = setInterval(tick, 250);
	}

	draw();
});

resetButton.addEventListener("click", function () {
	setMode(mode);
});

skipButton.addEventListener("click", function () {
	if (mode === "focus") {
		setMode(completed % 4 === 3 ? "long" : "short");
	} else {
		setMode("focus");
	}
});

modesBar.addEventListener("click", function (event) {
	const button = event.target.closest("button[data-mode]");

	if (button) {
		setMode(button.dataset.mode);
	}
});

Object.keys(inputs).forEach(function (key) {
	inputs[key].value = minutes[key];

	inputs[key].addEventListener("change", function () {
		const value = Math.floor(Number(inputs[key].value));

		if (!(value >= 1 && value <= 180)) {
			inputs[key].value = minutes[key];

			return;
		}

		minutes[key] = value;

		saveSettings();

		// a running timer is not changed under the user's feet
		if (!running && mode === key) {
			setMode(mode);
		}
	});
});

draw();
