// Explorer

const explorerButton = document.getElementById("explorerButton");

const explorerWindow = document.getElementById("explorerWindow");

const closeExplorer = document.getElementById("closeExplorer");

explorerButton.addEventListener("click", function () {
	explorerWindow.classList.toggle("show");

	if (explorerWindow.classList.contains("show")) {
		bringToFront(explorerWindow);
	}
});

explorerWindow.addEventListener("pointerdown", function () {
	bringToFront(explorerWindow);
});

closeExplorer.addEventListener("click", function () {
	explorerWindow.classList.remove("show");
});

// Move explorer

const explorerHeader = document.querySelector(".explorer-header");

let isDragging = false;

let offsetX = 0;
let offsetY = 0;

explorerHeader.addEventListener("pointerdown", function (event) {
	if (event.target.closest(".close-explorer")) {
		return;
	}

	isDragging = true;

	const rect = explorerWindow.getBoundingClientRect();

	offsetX = event.clientX - rect.left;

	offsetY = event.clientY - rect.top;

	explorerWindow.style.transform = "none";

	explorerWindow.style.left = rect.left + "px";

	explorerWindow.style.top = rect.top + "px";

	explorerHeader.setPointerCapture(event.pointerId);
});

explorerHeader.addEventListener("pointermove", function (event) {
	if (!isDragging) {
		return;
	}

	explorerWindow.style.left = event.clientX - offsetX + "px";

	explorerWindow.style.top = Math.max(0, event.clientY - offsetY) + "px";
});

explorerHeader.addEventListener("pointerup", function (event) {
	isDragging = false;

	explorerHeader.releasePointerCapture(event.pointerId);
});
