// Image Viewer

const APP_ID = "imageviewer";
const files = window.browos && window.browos.files;

const img = document.getElementById("img");
const stage = document.getElementById("stage");
const empty = document.getElementById("empty");
const nameEl = document.getElementById("name");
const prevButton = document.getElementById("prev");
const nextButton = document.getElementById("next");
const saveButton = document.getElementById("saveButton");
const fileInput = document.getElementById("fileInput");

let url = null;
let zoom = 1;
let turn = 0;
let fitMode = true;
let siblings = [];
let position = -1;
let current = null; // { id, name } for files from Files, null for a file from the computer
let currentBlob = null;

function paint() {
	stage.classList.toggle("fit", fitMode);

	img.style.width = fitMode ? "" : Math.round(img.naturalWidth * zoom) + "px";
	img.style.transform = "rotate(" + turn + "deg)";
}

function show(blob, name, fileNode) {
	if (url) {
		URL.revokeObjectURL(url);
	}

	currentBlob = blob;
	current = fileNode || null;

	url = URL.createObjectURL(blob);

	img.hidden = false;
	empty.hidden = true;

	img.onload = function () {
		zoom = 1;
		turn = 0;
		fitMode = true;

		paint();
	};

	img.onerror = function () {
		img.hidden = true;
		empty.hidden = false;
		empty.textContent = "That file can't be shown as a picture.";
	};

	img.src = url;

	nameEl.textContent = name;

	saveButton.hidden = Boolean(fileNode);
}

async function loadFromFiles(id) {
	const node = await files.read(id);

	show(node.blob, node.name, { id: id, name: node.name });

	// the pictures next to it
	const list = await files.list(node.parent);

	siblings = list.filter(function (item) {
		return item.type === "file" && files.kind(item.name, item.mime) === "image";
	});

	position = siblings.findIndex(function (item) {
		return item.id === id;
	});

	prevButton.disabled = nextButton.disabled = siblings.length < 2;
}

function step(direction) {
	if (siblings.length < 2) {
		return;
	}

	position = (position + direction + siblings.length) % siblings.length;

	loadFromFiles(siblings[position].id);
}

document.getElementById("openButton").addEventListener("click", function () {
	fileInput.click();
});

fileInput.addEventListener("change", function () {
	const file = fileInput.files[0];

	if (file) {
		siblings = [];
		prevButton.disabled = nextButton.disabled = true;

		show(file, file.name, null);
	}

	fileInput.value = "";
});

prevButton.addEventListener("click", function () { step(-1); });
nextButton.addEventListener("click", function () { step(1); });

document.getElementById("zoomIn").addEventListener("click", function () {
	if (fitMode) {
		zoom = Math.min(1, img.clientWidth / img.naturalWidth) || 1;
		fitMode = false;
	}

	zoom = Math.min(8, zoom * 1.25);

	paint();
});

document.getElementById("zoomOut").addEventListener("click", function () {
	if (fitMode) {
		zoom = Math.min(1, img.clientWidth / img.naturalWidth) || 1;
		fitMode = false;
	}

	zoom = Math.max(0.1, zoom / 1.25);

	paint();
});

document.getElementById("fit").addEventListener("click", function () {
	fitMode = true;
	turn = turn % 360;

	paint();
});

document.getElementById("rotate").addEventListener("click", function () {
	turn = (turn + 90) % 360;

	paint();
});

saveButton.addEventListener("click", function () {
	if (currentBlob && files) {
		files.write("root", nameEl.textContent, currentBlob).then(function (node) {
			saveButton.hidden = true;

			nameEl.textContent = node.name + " (saved to Files)";
		});
	}
});

stage.addEventListener("wheel", function (event) {
	if (event.ctrlKey) {
		event.preventDefault();

		document.getElementById(event.deltaY < 0 ? "zoomIn" : "zoomOut").click();
	}
}, { passive: false });

document.addEventListener("keydown", function (event) {
	if (event.key === "ArrowLeft") {
		step(-1);
	} else if (event.key === "ArrowRight") {
		step(1);
	} else if (event.key === "+" || event.key === "=") {
		document.getElementById("zoomIn").click();
	} else if (event.key === "-") {
		document.getElementById("zoomOut").click();
	} else if (event.key === "0") {
		document.getElementById("fit").click();
	} else if (event.key === "r") {
		document.getElementById("rotate").click();
	}
});

// opened from Files
if (files) {
	const first = files.takeOpenRequest(APP_ID);

	if (first) {
		loadFromFiles(first);
	}

	window.parent.document.addEventListener("open-file", function (event) {
		if (event.detail.app === APP_ID) {
			files.takeOpenRequest(APP_ID);

			loadFromFiles(event.detail.id);
		}
	});
}

window.addEventListener("beforeunload", function () {
	if (url) {
		URL.revokeObjectURL(url);
	}
});
