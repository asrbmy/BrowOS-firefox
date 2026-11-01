// Desktop icons

const gridSize = 90;

const gridStartX = 32;
const gridStartY = 29;

function makeIconDraggable(icon) {
	let dragging = false;

	let offsetX = 0;

	let offsetY = 0;

	// where the icon was before the drag, to send it back if needed

	let startLeft = 0;
	let startTop = 0;

	icon.addEventListener("pointerdown", function (event) {
		if (event.button !== 0 || event.target.isContentEditable) {
			return;
		}

		dragging = true;

		const rect = icon.getBoundingClientRect();

		offsetX = event.clientX - rect.left;

		offsetY = event.clientY - rect.top;

		startLeft = rect.left;
		startTop = rect.top;

		icon.style.left = rect.left + "px";

		icon.style.top = rect.top + "px";

		icon.setPointerCapture(event.pointerId);

		icon.style.zIndex = "50";
	});

	icon.addEventListener("pointermove", function (event) {
		if (!dragging) {
			return;
		}

		let x = event.clientX - offsetX;

		let y = event.clientY - offsetY;

		const maxX = window.innerWidth - icon.offsetWidth;

		const maxY = window.innerHeight - 100 - icon.offsetHeight;

		x = Math.max(0, Math.min(x, maxX));

		y = Math.max(0, Math.min(y, maxY));

		icon.style.left = x + "px";

		icon.style.top = y + "px";
	});

	// the grid cell an icon position belongs to

	function cellOf(left, top) {
		return [
			Math.round((left - gridStartX) / gridSize),
			Math.round((top - gridStartY) / gridSize),
		];
	}

	function dropIcon(event, cancelled) {
		if (!dragging) {
			return;
		}

		dragging = false;

		const rect = icon.getBoundingClientRect();

		// the nearest grid cell that is still on screen

		const columns = Math.max(
			1,
			Math.floor((window.innerWidth - gridStartX - icon.offsetWidth) / gridSize) + 1
		);

		const rows = Math.max(
			1,
			Math.floor((window.innerHeight - 100 - gridStartY - icon.offsetHeight) / gridSize) + 1
		);

		const cell = cellOf(rect.left, rect.top);

		const column = Math.min(Math.max(cell[0], 0), columns - 1);

		const row = Math.min(Math.max(cell[1], 0), rows - 1);

		let left = gridStartX + column * gridSize;

		let top = gridStartY + row * gridSize;

		// another icon already lives there: go back to where it was

		const taken = Array.from(document.querySelectorAll(".desktop-icon")).some(function (other) {
			if (other === icon) {
				return false;
			}

			const otherCell = cellOf(parseInt(other.style.left), parseInt(other.style.top));

			return otherCell[0] === column && otherCell[1] === row;
		});

		if (taken || cancelled) {
			left = startLeft;
			top = startTop;
		}

		// slide into place

		icon.style.transition = "left 0.15s, top 0.15s";

		icon.style.left = left + "px";

		icon.style.top = top + "px";

		setTimeout(function () {
			icon.style.transition = "";
		}, 160);

		icon.style.zIndex = "10";

		if (event && icon.hasPointerCapture(event.pointerId)) {
			icon.releasePointerCapture(event.pointerId);
		}

		// remember where every icon is

		saveDesktopLayout();
	}

	icon.addEventListener("pointerup", function (event) {
		dropIcon(event, false);
	});

	icon.addEventListener("pointercancel", function (event) {
		dropIcon(event, true);
	});
}
