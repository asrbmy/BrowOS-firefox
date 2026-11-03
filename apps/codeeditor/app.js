// Code Editor: a textarea with a colored copy underneath, saving to the BrowOS Files

const APP_ID = "codeeditor";
const files = window.browos && window.browos.files;

const text = document.getElementById("text");
const highlight = document.getElementById("highlight");
const lines = document.getElementById("lines");
const nameEl = document.getElementById("name");
const statusEl = document.getElementById("status");
const wrap = document.getElementById("wrap");
const fileInput = document.getElementById("fileInput");
const root = document.querySelector(".ce");

let fileId = null; // the file in Files this text belongs to
let fileName = "Untitled.txt";
let saved = "";

function dirty() {
	return text.value !== saved;
}

function paint() {
	// a trailing newline needs a character after it or the last empty line is not drawn
	highlight.innerHTML = BrowHighlight.colorize(text.value, fileName) + "\n";

	const count = text.value.split("\n").length;

	let numbers = "";

	for (let i = 1; i <= count; i++) {
		numbers += i + "\n";
	}

	lines.textContent = numbers;

	nameEl.textContent = fileName;
	nameEl.classList.toggle("dirty", dirty());

	position();
}

function position() {
	const before = text.value.slice(0, text.selectionStart).split("\n");

	statusEl.textContent =
		"Line " + before.length + ", column " + (before[before.length - 1].length + 1) + " · " + text.value.length + " characters · " + (BrowHighlight.languageFor(fileName) || "text");
}

function fit() {
	// the textarea grows with its text so the editor scrolls as one piece
	text.style.height = "0";
	text.style.height = Math.max(text.scrollHeight, text.parentElement.clientHeight) + "px";
	highlight.style.height = text.style.height;
}

function setText(value, name, id) {
	text.value = value;

	saved = value;
	fileName = name;
	fileId = id;

	paint();
	fit();
}

function confirmDiscard() {
	return !dirty() || confirm("Discard the changes to " + fileName + "?");
}

text.addEventListener("input", function () {
	paint();
	fit();
});

text.addEventListener("keyup", position);
text.addEventListener("click", position);

text.addEventListener("keydown", function (event) {
	if (event.key === "Tab" && !event.ctrlKey && !event.altKey) {
		event.preventDefault();

		document.execCommand("insertText", false, "\t");
	}
});

wrap.addEventListener("change", function () {
	root.classList.toggle("wrapping", wrap.checked);

	fit();
});

window.addEventListener("resize", fit);

async function save(asNew) {
	if (!files) {
		return;
	}

	let name = fileName;

	if (asNew || !fileId) {
		name = prompt("File name", fileName);

		if (!name) {
			return;
		}
	}

	try {
		const node = await files.write("root", name, new Blob([text.value], { type: "text/plain" }), asNew || !fileId ? undefined : { overwriteId: fileId });

		fileId = node.id;
		fileName = node.name;
		saved = text.value;

		paint();

		statusEl.textContent = "Saved to Files as " + node.name;
	} catch (error) {
		statusEl.textContent = "Couldn't save: " + error.message;
	}
}

document.getElementById("saveButton").addEventListener("click", function () { save(false); });
document.getElementById("saveAsButton").addEventListener("click", function () { save(true); });

document.getElementById("newButton").addEventListener("click", function () {
	if (confirmDiscard()) {
		setText("", "Untitled.txt", null);
	}
});

document.getElementById("openButton").addEventListener("click", function () {
	if (confirmDiscard()) {
		fileInput.click();
	}
});

fileInput.addEventListener("change", async function () {
	const file = fileInput.files[0];

	if (file) {
		setText(await file.text(), file.name, null);
	}

	fileInput.value = "";
});

document.addEventListener("keydown", function (event) {
	if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
		event.preventDefault();

		save(event.shiftKey);
	}
});

async function loadFromFiles(id) {
	if (!confirmDiscard()) {
		return;
	}

	const node = await files.read(id);

	setText(await node.blob.text(), node.name, id);
}

window.addEventListener("beforeunload", function (event) {
	if (dirty()) {
		event.preventDefault();
	}
});

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

paint();
fit();
