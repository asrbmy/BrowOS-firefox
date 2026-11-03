// Interface sounds
// Short tones made with the browser's own audio engine, so there are no sound files to ship.

let uiAudio = null;

function uiSoundsOn() {
	return localStorage.getItem("browos-ui-sounds") !== "off";
}

function uiVolume() {
	// the same volume as the startup sound, kept gentle
	const saved = Number(localStorage.getItem("volume"));

	return (Number.isFinite(saved) && localStorage.getItem("volume") !== null ? saved : 70) / 100;
}

// [frequency in Hz, start in seconds, length in seconds]
const UI_SOUNDS = {
	open: { wave: "sine", notes: [[520, 0, 0.08], [780, 0.07, 0.1]] },
	close: { wave: "sine", notes: [[620, 0, 0.07], [400, 0.06, 0.1]] },
	error: { wave: "square", notes: [[170, 0, 0.16], [140, 0.16, 0.2]] },
	notify: { wave: "sine", notes: [[880, 0, 0.12], [1175, 0.1, 0.22]] },
	alarm: {
		wave: "sine",
		notes: [[988, 0, 0.14], [988, 0.2, 0.14], [988, 0.4, 0.14], [1319, 0.6, 0.3]],
	},
};

// "force" plays the sound even when interface sounds are turned off (timers and alarms)
function playUiSound(name, force) {
	const sound = UI_SOUNDS[name];

	if (!sound || (!force && !uiSoundsOn())) {
		return;
	}

	const volume = uiVolume();

	if (volume <= 0) {
		return;
	}

	try {
		uiAudio = uiAudio || new AudioContext();

		if (uiAudio.state === "suspended") {
			uiAudio.resume();
		}

		const start = uiAudio.currentTime;

		sound.notes.forEach(function (note) {
			const oscillator = uiAudio.createOscillator();

			const gain = uiAudio.createGain();

			const peak = 0.18 * volume;

			oscillator.type = sound.wave;
			oscillator.frequency.value = note[0];

			// a quick fade in and out avoids clicks
			gain.gain.setValueAtTime(0.0001, start + note[1]);
			gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), start + note[1] + 0.015);
			gain.gain.exponentialRampToValueAtTime(0.0001, start + note[1] + note[2]);

			oscillator.connect(gain);
			gain.connect(uiAudio.destination);

			oscillator.start(start + note[1]);
			oscillator.stop(start + note[1] + note[2] + 0.02);
		});
	} catch (error) {
		// no audio available, the desktop works without it
	}
}

// open and close sounds, played only when a window really appears or disappears

const openAppBase = openApp;

openApp = function (appWindow) {
	const wasOpen = appWindow.classList.contains("show");

	openAppBase(appWindow);

	if (!wasOpen) {
		playUiSound("open");
	}
};

const closeAppBase = closeApp;

closeApp = function (appWindow) {
	const wasOpen = appWindow.classList.contains("show");

	closeAppBase(appWindow);

	if (wasOpen) {
		playUiSound("close");
	}
};

// settings: Startup page

const uiSoundsToggle = document.getElementById("uiSoundsToggle");

if (uiSoundsToggle) {
	uiSoundsToggle.checked = uiSoundsOn();

	uiSoundsToggle.addEventListener("change", function () {
		localStorage.setItem("browos-ui-sounds", uiSoundsToggle.checked ? "on" : "off");

		document.dispatchEvent(new Event("ui-sounds-changed"));

		if (uiSoundsToggle.checked) {
			playUiSound("notify");
		}
	});

	// the quick settings panel changes it too
	document.addEventListener("ui-sounds-changed", function () {
		uiSoundsToggle.checked = uiSoundsOn();
	});
}
