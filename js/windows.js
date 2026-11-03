// Window manager

let highestWindowZ = 100;

function bringToFront(windowElement) {
	highestWindowZ++;

	windowElement.style.zIndex = highestWindowZ;
}

// Snapping
// Drag a window to the left or right edge for half the screen, or to the top edge to maximize.

const SNAP_EDGE = 8;

// the free space above the taskbar
function snapArea() {
	return { width: window.innerWidth, height: window.innerHeight - 90 };
}

function snapZoneAt(x, y) {
	if (y <= SNAP_EDGE) {
		return "max";
	}

	if (x <= SNAP_EDGE) {
		return "left";
	}

	if (x >= window.innerWidth - SNAP_EDGE) {
		return "right";
	}

	return null;
}

function snapRect(zone) {
	const area = snapArea();

	if (zone === "max") {
		return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
	}

	const half = Math.floor(area.width / 2);

	return {
		left: zone === "left" ? 0 : half,
		top: 0,
		width: half,
		height: area.height,
	};
}

let snapPreview = null;

function showSnapPreview(zone) {
	if (!snapPreview) {
		snapPreview = document.createElement("div");

		snapPreview.className = "snap-preview";

		document.querySelector(".desktop-shell").appendChild(snapPreview);
	}

	if (!zone) {
		snapPreview.classList.remove("show");

		return;
	}

	const rect = snapRect(zone);

	snapPreview.style.left = rect.left + "px";
	snapPreview.style.top = rect.top + "px";
	snapPreview.style.width = rect.width + "px";
	snapPreview.style.height = rect.height + "px";

	snapPreview.classList.add("show");
}

// zone: "left", "right", "max" or "restore"
function snapWindow(appWindow, zone) {
	if (zone === "restore") {
		unsnapWindow(appWindow);

		return;
	}

	if (zone === "max") {
		unsnapWindow(appWindow);

		if (!appWindow.classList.contains("maximized")) {
			toggleMaximize(appWindow);
		}

		return;
	}

	// from maximized straight to a half
	if (appWindow.classList.contains("maximized")) {
		toggleMaximize(appWindow);
	}

	// remember the normal size, once
	if (!appWindow.dataset.snapped) {
		appWindow.dataset.beforeSnap = JSON.stringify({
			width: appWindow.style.width,
			height: appWindow.style.height,
		});
	}

	const rect = snapRect(zone);

	appWindow.style.transform = "none";
	appWindow.style.left = rect.left + "px";
	appWindow.style.top = rect.top + "px";
	appWindow.style.width = rect.width + "px";
	appWindow.style.height = rect.height + "px";

	appWindow.dataset.snapped = zone;

	bringToFront(appWindow);
}

// back to the size before snapping or maximizing
function unsnapWindow(appWindow) {
	if (appWindow.classList.contains("maximized")) {
		toggleMaximize(appWindow);
	}

	if (!appWindow.dataset.snapped) {
		return;
	}

	try {
		const before = JSON.parse(appWindow.dataset.beforeSnap);

		appWindow.style.width = before.width;
		appWindow.style.height = before.height;
	} catch (error) {
		appWindow.style.width = "";
		appWindow.style.height = "";
	}

	delete appWindow.dataset.snapped;
	delete appWindow.dataset.beforeSnap;
}

function setupWindow(appWindow) {
	const header = appWindow.querySelector(".window-header");

	const closeButton = appWindow.querySelector(".window-close");

	const minimizeButton = appWindow.querySelector(".window-minimize");

	let dragging = false;

	let offsetX = 0;

	let offsetY = 0;

	let snapZone = null;

	// where the pointer went down, so a small shake doesn't count as a drag
	let startX = 0;

	let startY = 0;

	appWindow.addEventListener("pointerdown", function () {
		bringToFront(appWindow);
	});

	closeButton.addEventListener("click", function () {
		closeApp(appWindow);
	});

	minimizeButton.addEventListener("click", function () {
		minimizeApp(appWindow);
	});

	header.addEventListener("pointerdown", function (event) {
		if (event.target.closest(".window-controls, .window-tools")) {
			return;
		}

		dragging = true;

		startX = event.clientX;

		startY = event.clientY;

		bringToFront(appWindow);

		const rect = appWindow.getBoundingClientRect();

		offsetX = event.clientX - rect.left;

		offsetY = event.clientY - rect.top;

		appWindow.style.transform = "none";

		appWindow.style.left = rect.left + "px";

		appWindow.style.top = rect.top + "px";

		header.setPointerCapture(event.pointerId);
	});

	header.addEventListener("pointermove", function (event) {
		if (!dragging) {
			return;
		}

		// dragging a maximized or snapped window brings back its normal size,
		// with the pointer at the same place along the title bar

		const wasMaximized = appWindow.classList.contains("maximized");

		if (wasMaximized || appWindow.dataset.snapped) {
			if (Math.abs(event.clientX - startX) < 5 && Math.abs(event.clientY - startY) < 5) {
				return;
			}

			const widthBefore = appWindow.getBoundingClientRect().width;

			const grabbedAt = widthBefore > 0 ? offsetX / widthBefore : 0.5;

			unsnapWindow(appWindow);

			const widthNow = appWindow.getBoundingClientRect().width;

			offsetX = Math.max(30, Math.min(widthNow - 30, grabbedAt * widthNow));
		}

		appWindow.style.left = event.clientX - offsetX + "px";

		appWindow.style.top = Math.max(0, event.clientY - offsetY) + "px";

		snapZone = snapZoneAt(event.clientX, event.clientY);

		showSnapPreview(snapZone);
	});

	function endDrag(event, cancelled) {
		if (!dragging) {
			return;
		}

		dragging = false;

		showSnapPreview(null);

		if (header.hasPointerCapture(event.pointerId)) {
			header.releasePointerCapture(event.pointerId);
		}

		if (snapZone && !cancelled) {
			snapWindow(appWindow, snapZone);
		}

		snapZone = null;
	}

	header.addEventListener("pointerup", function (event) {
		endDrag(event, false);
	});

	header.addEventListener("pointercancel", function (event) {
		endDrag(event, true);
	});
}

document.querySelectorAll(".app-window").forEach(setupWindow);

// Resizable windows

function makeResizable(windowElement) {
	const directions = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

	directions.forEach(function (direction) {
		const handle = document.createElement("div");

		handle.className = "resize-handle " + direction;

		windowElement.appendChild(handle);

		handle.addEventListener("pointerdown", function (event) {
			event.preventDefault();
			event.stopPropagation();

			const rect = windowElement.getBoundingClientRect();

			// resizing by hand ends a snap

			delete windowElement.dataset.snapped;
			delete windowElement.dataset.beforeSnap;

			// Remove initial centering transform

			windowElement.style.transform = "none";

			windowElement.style.left = rect.left + "px";

			windowElement.style.top = rect.top + "px";

			const startX = event.clientX;

			const startY = event.clientY;

			const startWidth = rect.width;

			const startHeight = rect.height;

			const startLeft = rect.left;

			const startTop = rect.top;

			const minWidth = 360;

			const minHeight = 240;

			handle.setPointerCapture(event.pointerId);

			function resize(event) {
				const deltaX = event.clientX - startX;

				const deltaY = event.clientY - startY;

				let newWidth = startWidth;

				let newHeight = startHeight;

				let newLeft = startLeft;

				let newTop = startTop;

				// Right

				if (direction.includes("e")) {
					newWidth = Math.max(minWidth, startWidth + deltaX);
				}

				// Left

				if (direction.includes("w")) {
					newWidth = Math.max(minWidth, startWidth - deltaX);

					newLeft = startLeft + (startWidth - newWidth);
				}

				// Bottom

				if (direction.includes("s")) {
					newHeight = Math.max(minHeight, startHeight + deltaY);
				}

				// Top

				if (direction.includes("n")) {
					newHeight = Math.max(minHeight, startHeight - deltaY);

					newTop = startTop + (startHeight - newHeight);
				}

				windowElement.style.width = newWidth + "px";

				windowElement.style.height = newHeight + "px";

				windowElement.style.left = newLeft + "px";

				windowElement.style.top = newTop + "px";
			}

			function stopResize() {
				handle.removeEventListener("pointermove", resize);

				handle.removeEventListener("pointerup", stopResize);
			}

			handle.addEventListener("pointermove", resize);

			handle.addEventListener("pointerup", stopResize);
		});
	});
}

document.querySelectorAll(".app-window, .explorer-window").forEach(function (windowElement) {
	makeResizable(windowElement);
});
