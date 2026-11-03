// PDF Viewer: uses the PDF reader built into the browser

const APP_ID = "pdfviewer";
const files = window.browos && window.browos.files;

const view = document.getElementById("view");
const empty = document.getElementById("empty");
const nameEl = document.getElementById("name");
const saveButton = document.getElementById("saveButton");
const downloadButton = document.getElementById("downloadButton");
const fileInput = document.getElementById("fileInput");

let url = null;
let blob = null;
let fileName = "document.pdf";

function show(data, name, saved) {
	if (url) {
		URL.revokeObjectURL(url);
	}

	// the type has to be PDF or the browser downloads it instead of showing it
	blob = data.type === "application/pdf" ? data : new Blob([data], { type: "application/pdf" });

	fileName = name;

	url = URL.createObjectURL(blob);

	view.src = url;
	view.hidden = false;
	empty.hidden = true;

	nameEl.textContent = name;

	downloadButton.hidden = false;
	saveButton.hidden = saved;
}

async function loadFromFiles(id) {
	const node = await files.read(id);

	show(node.blob, node.name, true);
}

document.getElementById("openButton").addEventListener("click", function () {
	fileInput.click();
});

fileInput.addEventListener("change", function () {
	const file = fileInput.files[0];

	if (file) {
		show(file, file.name, false);
	}

	fileInput.value = "";
});

downloadButton.addEventListener("click", function () {
	const link = document.createElement("a");

	link.href = url;
	link.download = fileName;

	document.body.appendChild(link);
	link.click();
	link.remove();
});

saveButton.addEventListener("click", function () {
	if (blob && files) {
		files.write("root", fileName, blob).then(function () {
			saveButton.hidden = true;

			nameEl.textContent = fileName + " (saved to Files)";
		});
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
