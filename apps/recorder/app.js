// Recorder: voice and screen recordings, kept in the Recordings folder of Files

const APP_ID = "recorder";
const os = window.browos;
const files = os && os.files;
const root = document.getElementById("app");

let mode = "voice";
let recorder = null;
let stream = null;
let chunks = [];
let startedAt = 0;
let timer = null;
let audioContext = null;
let meterFrame = 0;
let renderRun = 0;
let playing = null; // file id opened from Files
let urls = [];

root.innerHTML =
	'<div class="r-tabs" role="tablist"><button id="tabVoice" class="on" role="tab">Voice</button><button id="tabScreen" role="tab">Screen</button></div>' +
	'<div class="r-panel"><div class="r-time" id="time">00:00</div><div class="r-meter" id="meterBox"><div id="meter"></div></div><button class="r-record" id="record">Start recording</button><div class="r-msg" id="msg" role="status"></div></div>' +
	'<h3 style="margin:0">Recordings</h3><ul class="r-list" id="list"></ul>';

const tabVoice = document.getElementById("tabVoice");
const tabScreen = document.getElementById("tabScreen");
const timeEl = document.getElementById("time");
const meter = document.getElementById("meter");
const meterBox = document.getElementById("meterBox");
const recordButton = document.getElementById("record");
const msg = document.getElementById("msg");
const list = document.getElementById("list");

function say(text) {
	msg.textContent = text;
}

function setMode(next) {
	if (recorder) {
		return;
	}

	mode = next;

	tabVoice.classList.toggle("on", mode === "voice");
	tabScreen.classList.toggle("on", mode === "screen");

	meterBox.hidden = mode !== "voice";

	say(mode === "voice" ? "" : "You choose what to share when you start. Include audio if the picker offers it.");
}

tabVoice.addEventListener("click", () => setMode("voice"));
tabScreen.addEventListener("click", () => setMode("screen"));

function clock() {
	const s = Math.floor((Date.now() - startedAt) / 1000);

	timeEl.textContent = String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
}

function stamp() {
	const d = new Date();

	const p = (n) => String(n).padStart(2, "0");

	return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + "." + p(d.getMinutes()) + "." + p(d.getSeconds());
}

async function folderId() {
	const root_ = await files.list("root");

	const found = root_.find((n) => n.type === "folder" && n.name === "Recordings");

	return found ? found.id : (await files.mkdir("root", "Recordings")).id;
}

function stopTracks() {
	if (stream) {
		stream.getTracks().forEach((t) => t.stop());
	}

	stream = null;

	cancelAnimationFrame(meterFrame);

	if (audioContext) {
		audioContext.close();

		audioContext = null;
	}

	meter.style.width = "0";
}

async function start() {
	if (!files || !navigator.mediaDevices) {
		say("Recording isn't available here.");

		return;
	}

	try {
		stream =
			mode === "voice"
				? await navigator.mediaDevices.getUserMedia({ audio: true })
				: await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
	} catch (error) {
		say(error && error.name === "NotAllowedError" ? "Permission was not given." : "Couldn't start: " + (error && error.message ? error.message : "unknown error"));

		stream = null;

		return;
	}

	const wanted = mode === "voice" ? ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"] : ["video/webm;codecs=vp9,opus", "video/webm"];

	const type = wanted.find((t) => window.MediaRecorder && MediaRecorder.isTypeSupported(t)) || "";

	recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);

	chunks = [];

	recorder.ondataavailable = function (event) {
		if (event.data.size) {
			chunks.push(event.data);
		}
	};

	const kind = mode;

	recorder.onstop = async function () {
		const blob = new Blob(chunks, { type: recorder.mimeType || (kind === "voice" ? "audio/webm" : "video/webm") });

		stopTracks();

		clearInterval(timer);

		recorder = null;

		recordButton.textContent = "Start recording";
		recordButton.classList.remove("live");

		try {
			const node = await files.write(await folderId(), (kind === "voice" ? "Voice " : "Screen ") + stamp() + ".webm", blob);

			say("Saved to Files / Recordings as " + node.name);
		} catch (error) {
			say("Couldn't save the recording: " + error.message);
		}

		render();
	};

	// a screen share ends when the person stops sharing from the browser bar
	stream.getVideoTracks().forEach(function (track) {
		track.addEventListener("ended", function () {
			if (recorder && recorder.state !== "inactive") {
				recorder.stop();
			}
		});
	});

	if (mode === "voice") {
		audioContext = new AudioContext();

		const analyser = audioContext.createAnalyser();

		analyser.fftSize = 256;

		audioContext.createMediaStreamSource(stream).connect(analyser);

		const data = new Uint8Array(analyser.frequencyBinCount);

		(function tick() {
			analyser.getByteTimeDomainData(data);

			let peak = 0;

			for (const v of data) {
				peak = Math.max(peak, Math.abs(v - 128));
			}

			meter.style.width = Math.min(100, (peak / 128) * 140) + "%";

			meterFrame = requestAnimationFrame(tick);
		})();
	}

	recorder.start(1000);

	startedAt = Date.now();

	clock();

	timer = setInterval(clock, 500);

	recordButton.textContent = "Stop and save";
	recordButton.classList.add("live");

	say("Recording...");
}

recordButton.addEventListener("click", function () {
	if (recorder) {
		recorder.stop();
	} else {
		start();
	}
});

async function render() {
	const run = ++renderRun;

	if (!files) {
		return;
	}

	let items = [];

	const top = await files.list("root");

	const folder = top.find((n) => n.type === "folder" && n.name === "Recordings");

	if (folder) {
		items = (await files.list(folder.id)).filter((n) => n.type === "file");
	}

	// a recording opened from Files that lives somewhere else
	if (playing && !items.some((n) => n.id === playing)) {
		try {
			items.unshift(await files.read(playing));
		} catch (error) {
			// removed meanwhile
		}
	}

	if (run !== renderRun) {
		return;
	}

	items.sort((a, b) => b.modified - a.modified);

	const fresh = document.createDocumentFragment();

	const mine = [];

	if (items.length === 0) {
		const none = document.createElement("li");

		none.className = "muted";
		none.textContent = "No recordings yet.";

		fresh.appendChild(none);

		urls.forEach((u) => URL.revokeObjectURL(u));

		urls = [];

		list.replaceChildren(fresh);

		return;
	}

	for (const item of items) {
		const full = item.blob ? item : await files.read(item.id);

		if (run !== renderRun) {
			mine.forEach((u) => URL.revokeObjectURL(u));

			return;
		}

		const row = document.createElement("li");

		row.className = "r-item";

		const name = document.createElement("span");

		name.className = "name";
		name.textContent = full.name;

		const buttons = document.createElement("span");

		const remove = document.createElement("button");

		remove.textContent = "Delete";

		remove.addEventListener("click", function () {
			files.remove(full.id).then(render);
		});

		buttons.appendChild(remove);

		const isVideo = files.kind(full.name, full.mime) === "video" || /^video\//.test(full.mime || "");

		const media = document.createElement(isVideo ? "video" : "audio");

		media.controls = true;
		media.preload = "metadata";

		const url = URL.createObjectURL(full.blob);

		mine.push(url);

		media.src = url;

		row.append(name, buttons, media);

		if (full.id === playing) {
			row.style.outline = "2px solid var(--accent)";
		}

		fresh.appendChild(row);
	}

	urls.forEach((u) => URL.revokeObjectURL(u));

	urls = mine;

	list.replaceChildren(fresh);
}

if (files) {
	const first = files.takeOpenRequest(APP_ID);

	if (first) {
		playing = first;
	}

	window.parent.document.addEventListener("open-file", function (event) {
		if (event.detail.app === APP_ID) {
			files.takeOpenRequest(APP_ID);

			playing = event.detail.id;

			render();
		}
	});

	window.parent.document.addEventListener("files-changed", function () {
		if (!recorder) {
			render();
		}
	});
}

setMode("voice");

render();
