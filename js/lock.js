// Lock screen and screensaver
// The PIN is a privacy screen for your desktop, not strong security: anyone who can use
// your browser profile can still reach the data BrowOS keeps in it.

const lockScreenElement = document.getElementById("lockScreen");
const lockTime = document.getElementById("lockTime");
const lockDate = document.getElementById("lockDate");
const lockForm = document.getElementById("lockForm");
const lockPin = document.getElementById("lockPin");
const lockMessage = document.getElementById("lockMessage");

const PIN_KEY = "browos-pin";
const PIN_ITERATIONS = 150000;

// PIN

function bytesToBase64(bytes) {
	let text = "";

	bytes.forEach(function (byte) {
		text += String.fromCharCode(byte);
	});

	return btoa(text);
}

function base64ToBytes(text) {
	return Uint8Array.from(atob(text), function (character) {
		return character.charCodeAt(0);
	});
}

async function derivePinHash(pin, salt, iterations) {
	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(pin),
		"PBKDF2",
		false,
		["deriveBits"]
	);

	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", salt: salt, iterations: iterations, hash: "SHA-256" },
		key,
		256
	);

	return bytesToBase64(new Uint8Array(bits));
}

function savedPin() {
	try {
		const pin = JSON.parse(localStorage.getItem(PIN_KEY));

		if (pin && typeof pin.salt === "string" && typeof pin.hash === "string") {
			return pin;
		}
	} catch (error) {
		// no PIN
	}

	return null;
}

function hasPin() {
	return savedPin() !== null;
}

async function setPin(pin) {
	const salt = crypto.getRandomValues(new Uint8Array(16));

	localStorage.setItem(
		PIN_KEY,
		JSON.stringify({
			salt: bytesToBase64(salt),
			iterations: PIN_ITERATIONS,
			hash: await derivePinHash(pin, salt, PIN_ITERATIONS),
		})
	);
}

async function checkPin(pin) {
	const saved = savedPin();

	if (!saved) {
		return true;
	}

	const hash = await derivePinHash(pin, base64ToBytes(saved.salt), saved.iterations || PIN_ITERATIONS);

	return hash === saved.hash;
}

// Lock screen

let locked = false;
let lockedAt = 0;
let failedTries = 0;
let lockedOutUntil = 0;
let lockoutTimer = null;

function updateLockClock() {
	const now = new Date();

	lockTime.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

	lockDate.textContent = now.toLocaleDateString([], {
		weekday: "long",
		day: "numeric",
		month: "long",
	});
}

setInterval(function () {
	if (locked) {
		updateLockClock();
	}
}, 1000);

function showLockMessage(text) {
	lockMessage.textContent = text;
}

function lockScreen() {
	if (locked) {
		return;
	}

	locked = true;

	lockedAt = Date.now();

	sessionStorage.setItem("browos-locked", "1");

	closeStartMenu();

	closeFlyouts();

	// the same wallpaper as the desktop, blurred
	lockScreenElement.style.backgroundImage = desktopShell.style.backgroundImage;

	updateLockClock();

	lockPin.value = "";

	const withPin = hasPin();

	lockForm.classList.toggle("with-pin", withPin);

	showLockMessage(withPin ? "Enter your PIN" : "Click or press any key to unlock");

	lockScreenElement.hidden = false;

	// nothing behind the lock screen can be reached with the keyboard
	desktopShell.inert = true;

	if (withPin) {
		lockPin.focus();
	} else {
		lockScreenElement.focus();
	}
}

function unlockScreen() {
	locked = false;

	sessionStorage.removeItem("browos-locked");

	failedTries = 0;

	lockScreenElement.hidden = true;

	desktopShell.inert = false;
}

function lockoutLeft() {
	return Math.max(0, Math.ceil((lockedOutUntil - Date.now()) / 1000));
}

function showLockout() {
	clearInterval(lockoutTimer);

	function update() {
		const left = lockoutLeft();

		if (left <= 0) {
			clearInterval(lockoutTimer);

			lockPin.disabled = false;

			showLockMessage("Enter your PIN");

			lockPin.focus();

			return;
		}

		lockPin.disabled = true;

		showLockMessage("Too many tries. Try again in " + left + " s");
	}

	update();

	lockoutTimer = setInterval(update, 500);
}

lockForm.addEventListener("submit", async function (event) {
	event.preventDefault();

	if (!hasPin() || lockoutLeft() > 0) {
		return;
	}

	const entered = lockPin.value;

	lockPin.value = "";

	let correct = false;

	try {
		correct = await checkPin(entered);
	} catch (error) {
		showLockMessage("Couldn't check the PIN in this browser");

		return;
	}

	if (correct) {
		unlockScreen();

		return;
	}

	failedTries++;

	lockScreenElement.classList.remove("shake");

	// restart the shake animation
	void lockScreenElement.offsetWidth;

	lockScreenElement.classList.add("shake");

	if (failedTries >= 5) {
		failedTries = 0;

		lockedOutUntil = Date.now() + 30000;

		showLockout();
	} else {
		showLockMessage("Wrong PIN");
	}
});

// without a PIN the lock screen is only a cover: click or any key opens it
function quickUnlock(event) {
	if (!locked || hasPin() || Date.now() - lockedAt < 500) {
		return;
	}

	if (event.type === "keydown" && ["Shift", "Control", "Alt", "Meta"].includes(event.key)) {
		return;
	}

	unlockScreen();
}

lockScreenElement.addEventListener("pointerdown", quickUnlock);

document.addEventListener("keydown", quickUnlock);

// PIN digits only

lockPin.addEventListener("input", function () {
	lockPin.value = lockPin.value.replace(/\D/g, "").slice(0, 8);
});

// Idle detection and the screensaver

const screensaverElement = document.getElementById("screensaver");
const screensaverCanvas = document.getElementById("screensaverCanvas");
const screensaverClock = document.getElementById("screensaverClock");
const screensaverContext = screensaverCanvas.getContext("2d");

// things that should keep the screen awake, like music playing
const awakeReasons = new Set();

function idleKeepAwake(key, on) {
	if (on) {
		awakeReasons.add(key);
	} else {
		awakeReasons.delete(key);
	}
}

let lastActivity = Date.now();

function markActive() {
	lastActivity = Date.now();
}

onEveryDocument(function (doc) {
	["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach(function (name) {
		doc.addEventListener(name, markActive, { passive: true, capture: true });
	});
});

function saverEnabled() {
	return localStorage.getItem("browos-saver") !== "off";
}

function saverMinutes() {
	const minutes = Number(localStorage.getItem("browos-saver-minutes"));

	return minutes >= 1 ? minutes : 10;
}

function saverType() {
	const type = localStorage.getItem("browos-saver-type");

	return ["stars", "logo", "clock"].includes(type) ? type : "stars";
}

let saverRunning = false;
let saverFrame = 0;
let saverStartedAt = 0;
let saverPointer = null;
let saverClockTimer = null;

function stopScreensaver() {
	if (!saverRunning) {
		return;
	}

	saverRunning = false;

	cancelAnimationFrame(saverFrame);

	clearInterval(saverClockTimer);

	screensaverElement.hidden = true;

	lastActivity = Date.now();

	["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach(function (name) {
		window.removeEventListener(name, wakeScreensaver, true);
	});
}

function wakeScreensaver(event) {
	// the key or click that started it, or a small tremble of the mouse, doesn't count
	if (Date.now() - saverStartedAt < 600) {
		return;
	}

	if (event.type === "pointermove") {
		if (!saverPointer) {
			saverPointer = { x: event.clientX, y: event.clientY };

			return;
		}

		if (Math.abs(event.clientX - saverPointer.x) + Math.abs(event.clientY - saverPointer.y) < 8) {
			return;
		}
	}

	event.stopPropagation();

	event.preventDefault();

	stopScreensaver();
}

function sizeSaverCanvas() {
	screensaverCanvas.width = window.innerWidth;
	screensaverCanvas.height = window.innerHeight;
}

function runStars() {
	const stars = [];

	for (let i = 0; i < 220; i++) {
		stars.push({
			x: (Math.random() - 0.5) * 2,
			y: (Math.random() - 0.5) * 2,
			z: Math.random(),
		});
	}

	function frame() {
		const width = screensaverCanvas.width;
		const height = screensaverCanvas.height;

		screensaverContext.fillStyle = "#05060a";
		screensaverContext.fillRect(0, 0, width, height);

		stars.forEach(function (star) {
			star.z -= 0.004;

			if (star.z <= 0.01) {
				star.x = (Math.random() - 0.5) * 2;
				star.y = (Math.random() - 0.5) * 2;
				star.z = 1;
			}

			const x = width / 2 + (star.x / star.z) * (width / 4);
			const y = height / 2 + (star.y / star.z) * (height / 4);

			const size = (1 - star.z) * 3 + 0.4;

			screensaverContext.globalAlpha = Math.min(1, (1 - star.z) * 1.5);
			screensaverContext.fillStyle = "white";
			screensaverContext.fillRect(x, y, size, size);
		});

		screensaverContext.globalAlpha = 1;

		saverFrame = requestAnimationFrame(frame);
	}

	frame();
}

function runLogo() {
	const logo = new Image();

	logo.src = "icons/browos-logo.png";

	const size = 110;

	let x = Math.random() * (window.innerWidth - size);
	let y = Math.random() * (window.innerHeight - size);
	let dx = 1.4;
	let dy = 1.1;

	function frame() {
		const width = screensaverCanvas.width;
		const height = screensaverCanvas.height;

		screensaverContext.fillStyle = "#05060a";
		screensaverContext.fillRect(0, 0, width, height);

		x += dx;
		y += dy;

		if (x <= 0 || x >= width - size) {
			dx = -dx;
		}

		if (y <= 0 || y >= height - size) {
			dy = -dy;
		}

		x = Math.max(0, Math.min(width - size, x));
		y = Math.max(0, Math.min(height - size, y));

		if (logo.complete && logo.naturalWidth > 0) {
			screensaverContext.drawImage(logo, x, y, size, size);
		}

		saverFrame = requestAnimationFrame(frame);
	}

	frame();
}

function runClock() {
	screensaverContext.fillStyle = "#05060a";
	screensaverContext.fillRect(0, 0, screensaverCanvas.width, screensaverCanvas.height);

	screensaverClock.hidden = false;

	function tick() {
		screensaverClock.textContent = new Date().toLocaleTimeString([], {
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	// moves around now and then so the same pixels aren't lit all night
	function move() {
		screensaverClock.style.left = 8 + Math.random() * 50 + "%";
		screensaverClock.style.top = 10 + Math.random() * 65 + "%";
	}

	tick();
	move();

	saverClockTimer = setInterval(function () {
		tick();

		if (new Date().getSeconds() % 20 === 0) {
			move();
		}
	}, 1000);
}

function startScreensaver() {
	if (saverRunning) {
		return;
	}

	saverRunning = true;

	saverStartedAt = Date.now();

	saverPointer = null;

	closeStartMenu();

	closeFlyouts();

	if (localStorage.getItem("browos-saver-lock") === "on") {
		lockScreen();
	}

	sizeSaverCanvas();

	screensaverClock.hidden = true;

	screensaverElement.hidden = false;

	// keys typed from now on come to this page, even if an app had the focus
	if (document.activeElement && document.activeElement.blur) {
		document.activeElement.blur();
	}

	screensaverElement.focus();

	const type = saverType();

	if (type === "logo") {
		runLogo();
	} else if (type === "clock") {
		runClock();
	} else {
		runStars();
	}

	["pointermove", "pointerdown", "keydown", "wheel", "touchstart"].forEach(function (name) {
		window.addEventListener(name, wakeScreensaver, true);
	});
}

window.addEventListener("resize", function () {
	if (saverRunning) {
		sizeSaverCanvas();
	}
});

function checkIdle() {
	if (saverRunning || !saverEnabled()) {
		return;
	}

	// music or another job is keeping the screen awake
	if (awakeReasons.size > 0) {
		markActive();

		return;
	}

	// a website app (another origin) has focus: its clicks and keys can't be seen from here
	const focused = document.activeElement;

	if (
		document.hasFocus() &&
		focused &&
		focused.tagName === "IFRAME" &&
		!sameOriginDocument(focused)
	) {
		markActive();

		return;
	}

	if (Date.now() - lastActivity >= saverMinutes() * 60000) {
		startScreensaver();
	}
}

setInterval(checkIdle, 5000);

// Settings: Security page

const pinStatus = document.getElementById("pinStatus");
const pinCurrentRow = document.getElementById("pinCurrentRow");
const pinCurrent = document.getElementById("pinCurrent");
const pinNew = document.getElementById("pinNew");
const pinConfirm = document.getElementById("pinConfirm");
const pinSave = document.getElementById("pinSave");
const pinRemove = document.getElementById("pinRemove");
const pinMessage = document.getElementById("pinMessage");

function showPinState() {
	const has = hasPin();

	pinStatus.textContent = has ? "A PIN is set" : "No PIN is set";

	pinCurrentRow.hidden = !has;

	pinRemove.hidden = !has;

	pinSave.textContent = has ? "Change PIN" : "Set PIN";
}

function pinFeedback(text, good) {
	pinMessage.textContent = text;

	pinMessage.className = "pin-message" + (good ? " good" : "");
}

[pinCurrent, pinNew, pinConfirm].forEach(function (field) {
	field.addEventListener("input", function () {
		field.value = field.value.replace(/\D/g, "").slice(0, 8);
	});
});

pinSave.addEventListener("click", async function () {
	if (hasPin() && !(await checkPin(pinCurrent.value))) {
		pinFeedback("The current PIN is wrong.");

		return;
	}

	if (!/^\d{4,8}$/.test(pinNew.value)) {
		pinFeedback("A PIN is 4 to 8 digits.");

		return;
	}

	if (pinNew.value !== pinConfirm.value) {
		pinFeedback("The two PINs are not the same.");

		return;
	}

	try {
		await setPin(pinNew.value);
	} catch (error) {
		pinFeedback("This browser can't save a PIN here.");

		return;
	}

	pinCurrent.value = "";
	pinNew.value = "";
	pinConfirm.value = "";

	showPinState();

	pinFeedback("PIN saved.", true);
});

pinRemove.addEventListener("click", async function () {
	if (!(await checkPin(pinCurrent.value))) {
		pinFeedback("Enter the current PIN to remove it.");

		return;
	}

	localStorage.removeItem(PIN_KEY);

	pinCurrent.value = "";

	// no PIN means nothing to ask for at startup
	localStorage.setItem("browos-lock-startup", "off");

	lockStartupToggle.checked = false;

	showPinState();

	pinFeedback("PIN removed.", true);
});

const lockStartupToggle = document.getElementById("lockStartupToggle");
const saverToggle = document.getElementById("saverToggle");
const saverMinutesSelect = document.getElementById("saverMinutes");
const saverTypeSelect = document.getElementById("saverType");
const saverLockToggle = document.getElementById("saverLockToggle");

lockStartupToggle.checked = localStorage.getItem("browos-lock-startup") === "on";

lockStartupToggle.addEventListener("change", function () {
	if (lockStartupToggle.checked && !hasPin()) {
		lockStartupToggle.checked = false;

		pinFeedback("Set a PIN first.");

		return;
	}

	localStorage.setItem("browos-lock-startup", lockStartupToggle.checked ? "on" : "off");
});

saverToggle.checked = saverEnabled();

saverToggle.addEventListener("change", function () {
	localStorage.setItem("browos-saver", saverToggle.checked ? "on" : "off");
});

saverMinutesSelect.value = String(saverMinutes());

// a saved value that isn't in the list falls back to the default
if (saverMinutesSelect.value === "") {
	saverMinutesSelect.value = "10";
}

saverMinutesSelect.addEventListener("change", function () {
	localStorage.setItem("browos-saver-minutes", saverMinutesSelect.value);
});

saverTypeSelect.value = saverType();

saverTypeSelect.addEventListener("change", function () {
	localStorage.setItem("browos-saver-type", saverTypeSelect.value);
});

saverLockToggle.checked = localStorage.getItem("browos-saver-lock") === "on";

saverLockToggle.addEventListener("change", function () {
	localStorage.setItem("browos-saver-lock", saverLockToggle.checked ? "on" : "off");
});

document.getElementById("saverPreview").addEventListener("click", function () {
	startScreensaver();
});

showPinState();

// Startup: stay locked after a refresh, or lock when BrowOS opens

if (sessionStorage.getItem("browos-locked") === "1" || (hasPin() && localStorage.getItem("browos-lock-startup") === "on")) {
	lockScreen();
}

// Start menu: Lock

document.getElementById("lockMenuItem").addEventListener("click", function () {
	closeStartMenu();

	lockScreen();
});
