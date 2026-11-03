// Music player: plays audio files from your computer. Nothing is uploaded anywhere.

const audio = document.getElementById("audio");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const addButton = document.getElementById("addButton");
const clearButton = document.getElementById("clearButton");
const list = document.getElementById("list");
const title = document.getElementById("title");
const subtitle = document.getElementById("subtitle");
const art = document.getElementById("art");
const seek = document.getElementById("seek");
const currentText = document.getElementById("current");
const totalText = document.getElementById("total");
const playButton = document.getElementById("playButton");
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const shuffleButton = document.getElementById("shuffleButton");
const repeatButton = document.getElementById("repeatButton");
const volume = document.getElementById("volume");

// each song: { name, url }
let songs = [];
let index = -1;
let shuffle = false;
let repeat = "off"; // off, all, one
let seeking = false;

audio.volume = Number(volume.value) / 100;

function cleanName(fileName) {
	return fileName.replace(/\.[^.]+$/, "");
}

function formatTime(seconds) {
	if (!isFinite(seconds)) {
		return "0:00";
	}

	const whole = Math.floor(seconds);

	return Math.floor(whole / 60) + ":" + String(whole % 60).padStart(2, "0");
}

function keepAwake(on) {
	if (window.browos && window.browos.keepAwake) {
		window.browos.keepAwake("music", on);
	}
}

function renderList() {
	list.innerHTML = "";

	if (songs.length === 0) {
		const empty = document.createElement("li");

		empty.className = "music-empty";
		empty.textContent = "Your list is empty";

		list.appendChild(empty);

		return;
	}

	songs.forEach(function (song, position) {
		const row = document.createElement("li");

		row.className = position === index ? "current" : "";

		const name = document.createElement("span");

		name.textContent = song.name;

		const remove = document.createElement("button");

		remove.className = "music-remove";
		remove.textContent = "×";
		remove.title = "Remove from the list";

		remove.addEventListener("click", function (event) {
			event.stopPropagation();

			removeSong(position);
		});

		row.append(name, remove);

		row.addEventListener("click", function () {
			play(position);
		});

		list.appendChild(row);
	});
}

function showCurrent() {
	const song = songs[index];

	title.textContent = song ? song.name : "Nothing playing";

	subtitle.textContent = song
		? "Song " + (index + 1) + " of " + songs.length
		: "Add songs from your computer to start";

	art.textContent = song ? "♫" : "♪";

	seek.disabled = !song;

	renderList();
}

function play(position) {
	if (position < 0 || position >= songs.length) {
		return;
	}

	index = position;

	audio.src = songs[index].url;

	audio.play().catch(function () {
		// the browser refused or the file can't be played
		subtitle.textContent = "This file can't be played";
	});

	showCurrent();
}

function pickNext(step) {
	if (songs.length === 0) {
		return -1;
	}

	if (shuffle && songs.length > 1) {
		let random = index;

		while (random === index) {
			random = Math.floor(Math.random() * songs.length);
		}

		return random;
	}

	const next = index + step;

	if (next >= songs.length) {
		return repeat === "all" ? 0 : -1;
	}

	if (next < 0) {
		return songs.length - 1;
	}

	return next;
}

function removeSong(position) {
	const wasCurrent = position === index;

	URL.revokeObjectURL(songs[position].url);

	songs.splice(position, 1);

	if (wasCurrent) {
		audio.pause();
		audio.removeAttribute("src");
		audio.load();

		index = -1;
	} else if (position < index) {
		index--;
	}

	showCurrent();
}

function addFiles(files) {
	let added = 0;

	Array.from(files).forEach(function (file) {
		if (!file.type.startsWith("audio/")) {
			return;
		}

		songs.push({ name: cleanName(file.name), url: URL.createObjectURL(file) });

		added++;
	});

	if (added === 0) {
		return;
	}

	if (index === -1) {
		play(songs.length - added);
	} else {
		showCurrent();
	}
}

addButton.addEventListener("click", function () {
	fileInput.click();
});

fileInput.addEventListener("change", function () {
	addFiles(fileInput.files);

	fileInput.value = "";
});

clearButton.addEventListener("click", function () {
	songs.forEach(function (song) {
		URL.revokeObjectURL(song.url);
	});

	songs = [];
	index = -1;

	audio.pause();
	audio.removeAttribute("src");
	audio.load();

	showCurrent();
});

playButton.addEventListener("click", function () {
	if (index === -1) {
		if (songs.length > 0) {
			play(0);
		} else {
			fileInput.click();
		}

		return;
	}

	if (audio.paused) {
		audio.play().catch(function () {});
	} else {
		audio.pause();
	}
});

prevButton.addEventListener("click", function () {
	// like most players: the first press restarts the song
	if (audio.currentTime > 3) {
		audio.currentTime = 0;

		return;
	}

	const previous = pickNext(-1);

	if (previous !== -1) {
		play(previous);
	}
});

nextButton.addEventListener("click", function () {
	const next = pickNext(1);

	if (next !== -1) {
		play(next);
	} else if (songs.length > 0) {
		play(0);
	}
});

shuffleButton.addEventListener("click", function () {
	shuffle = !shuffle;

	shuffleButton.classList.toggle("on", shuffle);
});

repeatButton.addEventListener("click", function () {
	repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";

	repeatButton.classList.toggle("on", repeat !== "off");

	repeatButton.textContent = repeat === "one" ? "↻1" : "↻";

	repeatButton.title = "Repeat: " + repeat;
});

volume.addEventListener("input", function () {
	audio.volume = Number(volume.value) / 100;
});

audio.addEventListener("play", function () {
	playButton.textContent = "⏸";

	keepAwake(true);
});

audio.addEventListener("pause", function () {
	playButton.textContent = "▶";

	keepAwake(false);
});

audio.addEventListener("ended", function () {
	if (repeat === "one") {
		audio.currentTime = 0;

		audio.play().catch(function () {});

		return;
	}

	const next = pickNext(1);

	if (next !== -1) {
		play(next);
	} else {
		keepAwake(false);
	}
});

audio.addEventListener("loadedmetadata", function () {
	totalText.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", function () {
	currentText.textContent = formatTime(audio.currentTime);

	if (!seeking && audio.duration) {
		seek.value = (audio.currentTime / audio.duration) * 1000;
	}
});

seek.addEventListener("input", function () {
	seeking = true;

	if (audio.duration) {
		currentText.textContent = formatTime((seek.value / 1000) * audio.duration);
	}
});

seek.addEventListener("change", function () {
	if (audio.duration) {
		audio.currentTime = (seek.value / 1000) * audio.duration;
	}

	seeking = false;
});

// drag and drop
["dragenter", "dragover"].forEach(function (name) {
	dropZone.addEventListener(name, function (event) {
		event.preventDefault();

		dropZone.classList.add("dragging");
	});
});

["dragleave", "drop"].forEach(function (name) {
	dropZone.addEventListener(name, function (event) {
		event.preventDefault();

		dropZone.classList.remove("dragging");
	});
});

dropZone.addEventListener("drop", function (event) {
	addFiles(event.dataTransfer.files);
});

renderList();
